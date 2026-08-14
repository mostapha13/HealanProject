namespace TSEAI.Application.Entities;

public sealed class PersianEntityResolver(IEntityCandidateSource source) : IPersianEntityResolver
{
    public async Task<EntityResolution> ResolveAsync(string text, EntityResolveOptions? options, CancellationToken ct)
    {
        options ??= new EntityResolveOptions();
        var original = (text ?? string.Empty).Trim();
        if (original.Length is 0 or > 256)
            return new(EntityResolutionStatus.Invalid, original, string.Empty, null, [], "عبارت Entity نامعتبر است.");

        var queryForms = PersianEntityNormalizer.LookupForms(original);
        var normalized = queryForms.FirstOrDefault() ?? string.Empty;
        var compactForms = queryForms.Select(PersianEntityNormalizer.Compact).Where(x => x.Length > 0).Distinct().ToArray();
        var compact = compactForms.LastOrDefault() ?? PersianEntityNormalizer.Compact(original);
        if (normalized.Length < 2 && !long.TryParse(compact, out _))
            return new(EntityResolutionStatus.Invalid, original, normalized, null, [], "عبارت Entity بیش از حد کوتاه است.");

        var expected = options.ExpectedKinds?.Distinct().ToArray() ?? [];
        var sourceRows = await source.SearchAsync(new EntitySearchRequest(
            original, normalized, compact, expected, Math.Clamp(options.MaxCandidates * 12, 30, 120)), ct);

        var matches = sourceRows
            .Where(x => expected.Length == 0 || expected.Contains(x.Kind))
            .Select(x => Score(x, queryForms, compactForms))
            .Where(x => x.Score >= options.MinimumScore)
            .GroupBy(x => (x.Kind, x.CanonicalId))
            .Select(g => g.OrderByDescending(x => x.Score).ThenBy(x => x.MatchKind).First())
            .OrderByDescending(x => x.Score)
            .ThenBy(x => KindPriority(x.Kind))
            .ThenBy(x => x.DisplayName, StringComparer.Ordinal)
            .Take(Math.Clamp(options.MaxCandidates, 1, 10))
            .ToArray();

        if (matches.Length == 0)
            return new(EntityResolutionStatus.NoMatch, original, normalized, null, [], "Entity معتبری در داده‌های فعلی پیدا نشد.");

        var top = matches[0];
        if (matches.Length > 1 && IsAmbiguous(top, matches[1], options.AmbiguityDelta))
        {
            var names = string.Join("، ", matches.Take(4).Select(x => string.IsNullOrWhiteSpace(x.Symbol) ? x.DisplayName : $"{x.DisplayName} ({x.Symbol})"));
            return new(EntityResolutionStatus.Ambiguous, original, normalized, null, matches,
                $"عبارت «{original}» مبهم است. یکی از این موارد را مشخص کنید: {names}");
        }

        return new(EntityResolutionStatus.Resolved, original, normalized, top, matches, null);
    }

    private static EntityCandidateMatch Score(EntitySourceCandidate candidate, IReadOnlyList<string> queryForms, IReadOnlyList<string> compactForms)
    {
        var best = (Score: 0d, Kind: EntityMatchKind.None, Value: candidate.DisplayName);
        var queryTokenSets=queryForms.Select(x=>x.Split(' ',StringSplitOptions.RemoveEmptyEntries).Where(t=>t.Length>=2).ToHashSet(StringComparer.Ordinal)).ToArray();

        void Consider(string? value, double exactScore, EntityMatchKind exactKind)
        {
            if (string.IsNullOrWhiteSpace(value)) return;
            var n = PersianEntityNormalizer.Normalize(value);
            var c = PersianEntityNormalizer.Compact(value);
            if (n.Length == 0) return;

            foreach (var query in queryForms)
                if (string.Equals(n, query, StringComparison.Ordinal))
                    Set(exactScore, exactKind, value);

            foreach (var compactQuery in compactForms)
            {
                if (compactQuery.Length > 0 && string.Equals(c, compactQuery, StringComparison.Ordinal))
                    Set(Math.Min(exactScore, 0.925), EntityMatchKind.CompactExact, value);
                else if (compactQuery.Length >= 3 && c.StartsWith(compactQuery, StringComparison.Ordinal))
                    Set(0.84 - LengthPenalty(c, compactQuery), EntityMatchKind.Prefix, value);
                else if (compactQuery.Length >= 3 && c.Contains(compactQuery, StringComparison.Ordinal))
                    Set(0.78 - LengthPenalty(c, compactQuery), EntityMatchKind.Contains, value);
            }

            var candidateTokens=n.Split(' ',StringSplitOptions.RemoveEmptyEntries).ToHashSet(StringComparer.Ordinal);
            foreach(var queryTokens in queryTokenSets)
            {
                if(queryTokens.Count<2) continue;
                if(queryTokens.All(candidateTokens.Contains))
                {
                    var coverage=queryTokens.Count/(double)Math.Max(candidateTokens.Count,1);
                    Set(0.835+Math.Min(.04,coverage*.04),EntityMatchKind.Contains,value);
                    continue;
                }

                var shared=queryTokens.Count(candidateTokens.Contains);
                if(shared<2) continue;
                var candidateCoverage=shared/(double)Math.Max(candidateTokens.Count,1);
                Set(0.75+Math.Min(.08,candidateCoverage*.08)+Math.Min(.03,shared*.01),EntityMatchKind.Contains,value);
            }

            if(exactKind==EntityMatchKind.ExactSymbol&&queryTokenSets.Any(tokens=>tokens.Contains(n)))
                Set(0.965,EntityMatchKind.ExactSymbol,value);
        }

        void Set(double score, EntityMatchKind kind, string value)
        {
            if (score > best.Score || (Math.Abs(score - best.Score) < 0.0001 && kind < best.Kind))
                best = (score, kind, value);
        }

        Consider(candidate.CanonicalId, 1.0, EntityMatchKind.ExactIdentifier);
        Consider(candidate.InstrumentId, 1.0, EntityMatchKind.ExactIdentifier);
        if (candidate.InsCode is { } ins) Consider(ins.ToString(), 1.0, EntityMatchKind.ExactIdentifier);
        Consider(candidate.Isin, 0.998, EntityMatchKind.ExactIdentifier);
        Consider(candidate.Symbol, 0.990, EntityMatchKind.ExactSymbol);
        Consider(candidate.DisplayName, 0.945, EntityMatchKind.ExactName);
        foreach (var alias in candidate.Aliases) Consider(alias, 0.940, EntityMatchKind.ExactAlias);

        var preferPrimaryInstrument=InstrumentQuerySemantics.PrefersPrimaryInstrument(queryForms);
        var domainPriority=best.Score<=0?0:InstrumentDomainPriority(candidate,preferPrimaryInstrument);
        return new(candidate.Kind, candidate.CanonicalId, candidate.DisplayName, candidate.Symbol,
            candidate.InstrumentId, candidate.InsCode, candidate.Isin,
            Math.Round(Math.Clamp(best.Score+domainPriority,0,1), 4), best.Kind, best.Value, candidate.Metadata);
    }

    private static double InstrumentDomainPriority(EntitySourceCandidate candidate,bool preferPrimaryInstrument)
    {
        if(candidate.Kind!=EntityKind.Instrument||!preferPrimaryInstrument) return 0;
        var boost=0d;
        if(candidate.Metadata.TryGetValue("marketCategory",out var category)&&string.Equals(category,"cash",StringComparison.OrdinalIgnoreCase)) boost+=.035;
        if(candidate.InstrumentId?.EndsWith("0001",StringComparison.OrdinalIgnoreCase)==true) boost+=.04;
        if(!string.IsNullOrWhiteSpace(candidate.Symbol)&&!candidate.Symbol.Any(char.IsDigit)&&!candidate.Symbol.EndsWith("ح",StringComparison.Ordinal)) boost+=.02;
        return boost;
    }

    private static bool IsAmbiguous(EntityCandidateMatch first, EntityCandidateMatch second, double delta)
    {
        if (first.MatchKind is EntityMatchKind.ExactIdentifier) return false;
        if (first.CanonicalId == second.CanonicalId && first.Kind == second.Kind) return false;
        if(IsPrimaryCashInstrument(first)&&!IsPrimaryCashInstrument(second)) return false;
        return first.Score - second.Score <= Math.Clamp(delta, 0.005, 0.15);
    }

    private static bool IsPrimaryCashInstrument(EntityCandidateMatch candidate) =>
        candidate.Kind==EntityKind.Instrument
        && candidate.Metadata.TryGetValue("marketCategory",out var category)
        && string.Equals(category,"cash",StringComparison.OrdinalIgnoreCase)
        && candidate.InstrumentId?.EndsWith("0001",StringComparison.OrdinalIgnoreCase)==true
        && !string.IsNullOrWhiteSpace(candidate.Symbol)
        && !candidate.Symbol.Any(char.IsDigit)
        && !candidate.Symbol.EndsWith("ح",StringComparison.Ordinal);

    private static double LengthPenalty(string candidate, string query)
    {
        if (candidate.Length <= query.Length) return 0;
        var ratio = (candidate.Length - query.Length) / (double)Math.Max(candidate.Length, 1);
        return Math.Min(0.08, ratio * 0.08);
    }

    private static int KindPriority(EntityKind kind) => kind switch
    {
        EntityKind.Instrument => 0,
        EntityKind.MarketIndex => 1,
        EntityKind.Company => 2,
        EntityKind.TsePerson => 3,
        EntityKind.FinancialInstitution => 4,
        EntityKind.RegionHall => 5,
        _ => 99
    };
}
