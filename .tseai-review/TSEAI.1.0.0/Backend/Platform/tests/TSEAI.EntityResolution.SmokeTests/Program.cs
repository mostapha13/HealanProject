using TSEAI.Application.Entities;

static void Ensure(bool condition, string message)
{
    if (!condition) throw new InvalidOperationException(message);
}

var rows = new EntitySourceCandidate[]
{
    new(EntityKind.Instrument,"IRO1IKCO0001","ایران خودرو","خودرو","IRO1IKCO0001",46348559193224090,"IRO1IKCO0001",["ایران خودرو","ایران‌خودرو"],new Dictionary<string,string?>()),
    new(EntityKind.Instrument,"IRO1BMLT0001","بانک ملت","وبملت","IRO1BMLT0001",778253364357513,"IRO1BMLT0001",["بانک ملت"],new Dictionary<string,string?>()),
    new(EntityKind.Instrument,"IRO1BSDR0001","بانک صادرات ایران","وبصادر","IRO1BSDR0001",28320293733348826,"IRO1BSDR0001",["بانک صادرات","بانک صادرات ایران"],new Dictionary<string,string?>()),
    new(EntityKind.MarketIndex,"IRX6XTPI0006","شاخص کل بورس","شاخص کل","IRX6XTPI0006",32097828799138957,"IRX6XTPI0006",["شاخص کل","شاخص کل بورس"],new Dictionary<string,string?>()),
    new(EntityKind.TsePerson,"25:1:2","علی رضایی",null,null,null,null,["علی رضایی"],new Dictionary<string,string?> { ["role"]="مدیر" }),
    new(EntityKind.RegionHall,"10","تالار منطقه‌ای خوزستان",null,null,null,null,["خوزستان","تالار خوزستان"],new Dictionary<string,string?>()),
    new(EntityKind.FinancialInstitution,"20","کارگزاری نمونه",null,null,null,null,["کارگزاری نمونه"],new Dictionary<string,string?>()),
    new(EntityKind.Instrument,"DUP1","نمونه اول","تکرار","DUP1",11111111111,"DUP1",["نمونه اول"],new Dictionary<string,string?>()),
    new(EntityKind.Instrument,"DUP2","نمونه دوم","تکرار","DUP2",22222222222,"DUP2",["نمونه دوم"],new Dictionary<string,string?>())
};

var resolver = new PersianEntityResolver(new FakeSource(rows));

Ensure(PersianEntityNormalizer.Normalize("ايران‌خودرو") == "ایران خودرو", "Persian character/ZWNJ normalization failed.");
Ensure(PersianEntityNormalizer.Compact("بانکِ ملت") == "بانکملت", "Diacritic/compact normalization failed.");

var bySymbol = await resolver.ResolveAsync("خودرو", new EntityResolveOptions([EntityKind.Instrument]), default);
Ensure(bySymbol.Status == EntityResolutionStatus.Resolved && bySymbol.Selected?.InstrumentId == "IRO1IKCO0001", "Symbol resolution failed.");

var byCompany = await resolver.ResolveAsync("ایران خودرو", new EntityResolveOptions([EntityKind.Instrument]), default);
Ensure(byCompany.Status == EntityResolutionStatus.Resolved && byCompany.Selected?.Symbol == "خودرو", "Company-name alias resolution failed.");

var byArabic = await resolver.ResolveAsync("ايران خودرو", new EntityResolveOptions([EntityKind.Instrument]), default);
Ensure(byArabic.Status == EntityResolutionStatus.Resolved && byArabic.Selected?.Symbol == "خودرو", "Arabic/Persian variant resolution failed.");

var byCorporatePrefix = await resolver.ResolveAsync("شرکت ایران خودرو", new EntityResolveOptions([EntityKind.Instrument]), default);
Ensure(byCorporatePrefix.Status == EntityResolutionStatus.Resolved && byCorporatePrefix.Selected?.Symbol == "خودرو", "Corporate-prefix resolution failed.");

var byInsCode = await resolver.ResolveAsync("۴۶۳۴۸۵۵۹۱۹۳۲۲۴۰۹۰", new EntityResolveOptions([EntityKind.Instrument]), default);
Ensure(byInsCode.Status == EntityResolutionStatus.Resolved && byInsCode.Selected?.Symbol == "خودرو", "Persian-digit InsCode resolution failed.");

var index = await resolver.ResolveAsync("شاخص کل", new EntityResolveOptions([EntityKind.MarketIndex]), default);
Ensure(index.Status == EntityResolutionStatus.Resolved && index.Selected?.Kind == EntityKind.MarketIndex, "Index resolution failed.");

var ambiguous = await resolver.ResolveAsync("بانک", new EntityResolveOptions([EntityKind.Instrument]), default);
Ensure(ambiguous.Status == EntityResolutionStatus.Ambiguous && ambiguous.Candidates.Count >= 2, "Ambiguity guard failed.");

var duplicateSymbol = await resolver.ResolveAsync("تکرار", new EntityResolveOptions([EntityKind.Instrument]), default);
Ensure(duplicateSymbol.Status == EntityResolutionStatus.Ambiguous, "Duplicate-symbol ambiguity guard failed.");

var person = await resolver.ResolveAsync("علی رضایی", new EntityResolveOptions([EntityKind.TsePerson]), default);
Ensure(person.Status == EntityResolutionStatus.Resolved && person.Selected?.Kind == EntityKind.TsePerson, "Person resolution failed.");

var titledPerson = await resolver.ResolveAsync("دکتر علی رضایی", new EntityResolveOptions([EntityKind.TsePerson]), default);
Ensure(titledPerson.Status == EntityResolutionStatus.Resolved && titledPerson.Selected?.Kind == EntityKind.TsePerson, "Person-title resolution failed.");

var noMatch = await resolver.ResolveAsync("موجودیت ناشناخته", null, default);
Ensure(noMatch.Status == EntityResolutionStatus.NoMatch, "No-match fail-closed behavior failed.");

Console.WriteLine("TSEAI Entity Resolution smoke tests PASS");

file sealed class FakeSource(IReadOnlyList<EntitySourceCandidate> rows) : IEntityCandidateSource
{
    public Task<IReadOnlyList<EntitySourceCandidate>> SearchAsync(EntitySearchRequest request, CancellationToken ct)
        => Task.FromResult(rows);
}
