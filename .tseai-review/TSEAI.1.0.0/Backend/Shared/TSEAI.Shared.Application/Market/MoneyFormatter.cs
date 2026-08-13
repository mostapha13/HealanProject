using System.Globalization;
namespace TSEAI.Shared.Application.Market;
public static class MoneyFormatter
{
    public static string FormatIrr(decimal value)
    {
        var abs=Math.Abs(value); decimal scaled; string unit;
        if(abs>=1_000_000_000m){scaled=value/1_000_000_000m;unit="میلیارد ریال";}
        else if(abs>=1_000_000m){scaled=value/1_000_000m;unit="میلیون ریال";}
        else { return $"{value:N0} ریال"; }
        return $"{scaled:N2} {unit}";
    }
    public static decimal TomanToRial(decimal toman)=>checked(toman*10m);
}
