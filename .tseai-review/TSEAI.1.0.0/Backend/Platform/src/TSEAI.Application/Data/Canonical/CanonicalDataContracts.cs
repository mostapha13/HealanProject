namespace TSEAI.Application.Data.Canonical;

public enum CanonicalMoneyUnit
{
    Irr = 1,
    Toman = 2,
    ThousandIrr = 3,
    MillionIrr = 4
}

public enum CanonicalSourceMode
{
    Reference = 1,
    CurrentSnapshot = 2,
    AppendOrVersioned = 3,
    Derived = 4
}

public sealed record CanonicalSourceDescriptor(
    string Code,
    string TableName,
    CanonicalSourceMode Mode,
    IReadOnlyList<string> BusinessKeys,
    bool RequiredForPhase1 = true);

public sealed record CanonicalSourceTableStatus(
    string Code,
    string TableName,
    bool Exists,
    long? RowCount,
    DateTime? LatestSourceCollectedAt,
    string? Error = null);

public sealed record CanonicalDataStatus(
    bool Configured,
    string Database,
    IReadOnlyList<CanonicalSourceTableStatus> Sources);

public sealed record CanonicalInstrument(
    string InstrumentId,
    long InsCode,
    string? Isin,
    string? InstrumentSymbol,
    string? InstrumentName,
    string? IssuerSymbol,
    string? CompanyName,
    string? InstrumentCategory,
    int? MarketCategoryId,
    int? IndustryId,
    int? IndustrySubId,
    decimal? BaseVolume,
    int? Valid,
    DateTime? SourceCollectedAt);

public sealed record CanonicalCashMarketSnapshot(
    string InstrumentId,
    string? InstrumentName,
    string? CompanyName,
    long TradeVolume,
    decimal TradeValueIrr,
    long TradeCount,
    decimal? SessionHighPriceIrr,
    decimal? SessionLowPriceIrr,
    decimal? RawMinValueIrr,
    decimal? RawMaxValueIrr,
    decimal? FirstPriceIrr,
    decimal? LastPriceIrr,
    decimal? LastPriceChangeIrr,
    decimal? LastPriceChangePercent,
    decimal? ClosingPriceIrr,
    decimal? ClosingPriceChangeIrr,
    decimal? ClosingPriceChangePercent,
    decimal? YesterdayPriceIrr,
    decimal? EffectOnIndex,
    decimal? PE,
    decimal? Eps,
    decimal? MarketValueIrr,
    decimal? BestAskPriceIrr,
    long? BestAskQuantity,
    long? BestAskCount,
    decimal? BestBidPriceIrr,
    long? BestBidQuantity,
    long? BestBidCount,
    int? MarketId,
    string? MarketName,
    string? MarketTypeId,
    string? MarketTypeName,
    int? BoardId,
    string? BoardName,
    int? IndustryId,
    string? IndustryName,
    int? IndustrySubId,
    string? IndustrySubName,
    string? StateId,
    string? StateName,
    DateTime? SourceCollectedAt);

public sealed record CanonicalOrderBookLevel(
    string InstrumentId,
    long InsCode,
    int Level,
    decimal? BidPriceIrr,
    long BidQuantity,
    long BidOrderCount,
    decimal? AskPriceIrr,
    long AskQuantity,
    long AskOrderCount,
    long? BestLimitCounter,
    DateTime? OrderBookUpdatedAt,
    DateTime? SourceCollectedAt);

public sealed record CanonicalClientTypeSnapshot(
    long InsCode,
    long IndividualBuyCount,
    long LegalBuyCount,
    long IndividualBuyVolume,
    long LegalBuyVolume,
    long IndividualSellCount,
    long LegalSellCount,
    long IndividualSellVolume,
    long LegalSellVolume,
    long? Counter,
    DateTime? UpdatedAt,
    DateTime? SourceCollectedAt);

public sealed record CanonicalMarketSummaryRow(
    string MarketCategory,
    int MarketId,
    string? MarketName,
    decimal? MarketValueIrr,
    long TradeCount,
    long TradeVolume,
    decimal? TradeValueIrr,
    DateTime? SourceCollectedAt);

public sealed record CanonicalMarketIndex(
    string InstrumentId,
    decimal? IndexValue,
    decimal? HighValue,
    decimal? LowValue,
    long TradeCount,
    decimal? ChangePercent,
    decimal? ChangeValue,
    DateTime? SnapshotAt,
    long NegativeInstrumentCount,
    long PositiveInstrumentCount,
    long UnchangedInstrumentCount,
    long NoTradeInstrumentCount,
    long ReserveInstrumentCount,
    long SuspendedInstrumentCount,
    long TotalInstrumentCount,
    int MarketId,
    string? MarketName,
    DateTime? SourceCollectedAt);

public sealed record CanonicalCompanyStateRaw(
    string RawTitle,
    int? ResourceCode,
    DateTime? CreatedDate,
    string? LastDateChange,
    DateTime? SourceCollectedAt);

public sealed record CanonicalContentType(
    int Id,
    string Name,
    DateTime? SourceCollectedAt);

public sealed record CanonicalFinancialInstitutionType(
    Guid Id,
    string? Name,
    bool? IsBrokerage,
    DateTime? SourceCollectedAt);

public sealed record CanonicalCompanyReference(
    Guid Id,
    string? Name,
    Guid? TalarId,
    string? Url,
    string? CurrentCeoRaw,
    string? Phone,
    DateTime? IpoDate,
    Guid? SourceInstrumentId,
    DateTime? SourceCollectedAt);

public sealed record CanonicalDeliveryCategory(
    int Id,
    string? Name,
    int? ParentRef,
    int? LanguageId,
    int? SortOrder,
    DateTime? SourceCollectedAt);

public sealed record CanonicalDeliveryObjectRaw(
    long Id,
    string? Title,
    string? Description,
    int? LanguageId,
    int? CategoryId,
    bool? IsDeleted,
    DateTime? PublishedAt,
    DateTime? SourceCollectedAt);

public sealed record CanonicalRawKnowledgeRecord(
    long? Id,
    int? ContentTypeId,
    int? LanguageId,
    DateTime? PublishedAt,
    string? BodyHtml,
    DateTime? CreatedAt,
    DateTime? LastModifiedAt,
    bool? IsDeleted,
    DateTime? SourceCollectedAt);

public sealed record CanonicalFaqEntry(
    string? RawTitle,
    string QuestionText,
    string? AnswerRaw,
    int? ResourceCode,
    DateTime? CreatedDate,
    DateTime? SourceCollectedAt);

public sealed record CanonicalRegionHall(
    Guid Id,
    string? ProvinceName,
    string? Manager,
    long? Population,
    DateTime? StartDate,
    string? Phone,
    long? TradingCodeCount,
    long? JusticeShareCount,
    decimal? UnemploymentRate,
    decimal? EconomicRate,
    decimal? InflationRate,
    string? Address,
    decimal? GdpShare,
    string? GoogleLocation,
    decimal? LiteracyRate,
    DateTime? SourceCollectedAt);

public sealed record CanonicalFinancialInstitution(
    Guid Id,
    string? Name,
    Guid? TypeId,
    string? TypeName,
    string? Phone,
    string? Address,
    Guid? TalarId,
    string? ProvinceName,
    DateTime? SourceCollectedAt);

public sealed record CanonicalTsePerson(
    long ContentId,
    int? CategoryId,
    string FullName,
    string? Role,
    string? Phone,
    string? Fax,
    string? Email,
    int? SortOrder,
    bool? IsMaster,
    bool? IsManager,
    DateTime? SourceCollectedAt);

public interface ICanonicalDataGateway
{
    Task<CanonicalDataStatus> GetStatusAsync(CancellationToken ct);
    Task<CanonicalInstrument?> FindInstrumentAsync(string instrumentIdOrInsCodeOrSymbol, CancellationToken ct);
    Task<CanonicalCashMarketSnapshot?> GetCashMarketAsync(string instrumentId, CancellationToken ct);
    Task<IReadOnlyList<CanonicalOrderBookLevel>> GetOrderBookAsync(string instrumentId, CancellationToken ct);
    Task<CanonicalClientTypeSnapshot?> GetClientTypeAsync(string instrumentId, CancellationToken ct);
    Task<IReadOnlyList<CanonicalMarketSummaryRow>> GetMarketSummaryAsync(int? marketId, CancellationToken ct);
    Task<IReadOnlyList<CanonicalMarketIndex>> GetMarketIndexesAsync(int? marketId, CancellationToken ct);
}
