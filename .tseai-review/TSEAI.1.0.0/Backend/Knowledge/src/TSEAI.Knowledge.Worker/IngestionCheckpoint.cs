namespace TSEAI.Knowledge.Worker;

public sealed record IngestionCheckpoint(
    DateTimeOffset Watermark,
    string LastSourceId,
    DateTimeOffset LastSuccessfulRunUtc,
    DateTimeOffset? LastReconciliationUtc = null)
{
    public static int Compare(IngestionCheckpoint left, IngestionCheckpoint right)
    {
        var byWatermark = left.Watermark.CompareTo(right.Watermark);
        return byWatermark != 0
            ? byWatermark
            : StringComparer.Ordinal.Compare(left.LastSourceId, right.LastSourceId);
    }
}
