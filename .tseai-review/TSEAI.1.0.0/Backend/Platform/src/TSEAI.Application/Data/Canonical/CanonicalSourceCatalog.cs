namespace TSEAI.Application.Data.Canonical;

public static class CanonicalSourceCatalog
{
    public static IReadOnlyList<CanonicalSourceDescriptor> All { get; } =
    [
        new("instrument", "Instrument", CanonicalSourceMode.Reference, ["InstrumentID"]),
        new("cash-market", "Cashmarket", CanonicalSourceMode.CurrentSnapshot, ["InstrumentID"]),
        new("order-book", "OrderBookCurrent", CanonicalSourceMode.CurrentSnapshot, ["InstrumentID", "Level"]),
        new("client-type", "ClientType", CanonicalSourceMode.CurrentSnapshot, ["InsCode"]),
        new("market-summary", "Marketsummary", CanonicalSourceMode.CurrentSnapshot, ["Marketid", "Marketcatery"]),
        new("market-index", "IndexLastLive", CanonicalSourceMode.CurrentSnapshot, ["Instrumentid"]),
        new("company-state", "Companystate", CanonicalSourceMode.CurrentSnapshot, ["Namad"]),
        new("content-type", "ContentType", CanonicalSourceMode.Reference, ["Id"]),
        new("content", "Content", CanonicalSourceMode.AppendOrVersioned, ["Id"]),
        new("faq", "FAQ", CanonicalSourceMode.AppendOrVersioned, ["QuestionText"]),
        new("talar", "Talar", CanonicalSourceMode.Reference, ["Id"]),
        new("talar-info", "TalarInfo", CanonicalSourceMode.CurrentSnapshot, ["Id"]),
        new("financial-institution-type", "Nahad_Mali_Type", CanonicalSourceMode.Reference, ["Id"]),
        new("financial-institution", "Nahad_Mali", CanonicalSourceMode.CurrentSnapshot, ["Id"]),
        new("company", "Company", CanonicalSourceMode.CurrentSnapshot, ["Id"]),
        new("tse-person", "TsePerson", CanonicalSourceMode.CurrentSnapshot, ["ContentId"]),
        new("delivery-category", "EDeliveryCatery", CanonicalSourceMode.Reference, ["Id"], false),
        new("delivery-object", "EDeliveryObject", CanonicalSourceMode.AppendOrVersioned, ["ContentId"], false)
    ];
}
