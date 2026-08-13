namespace TSEAI.Application.Data.Canonical;

public static class CanonicalMoneyNormalizer
{
    public static decimal? ToIrr(decimal? value, CanonicalMoneyUnit unit)
    {
        if (value is null) return null;
        return unit switch
        {
            CanonicalMoneyUnit.Irr => value,
            CanonicalMoneyUnit.Toman => checked(value.Value * 10m),
            CanonicalMoneyUnit.ThousandIrr => checked(value.Value * 1_000m),
            CanonicalMoneyUnit.MillionIrr => checked(value.Value * 1_000_000m),
            _ => throw new ArgumentOutOfRangeException(nameof(unit), unit, "Unsupported source monetary unit.")
        };
    }
}
