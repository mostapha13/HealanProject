using TSEAI.Shared.Application.Market;
namespace TSEAI.Application.Filters.Execution;
public sealed record TsetmcFieldDefinition(string Code,string CanonicalName,string PersianName,Func<MarketSymbolSnapshot,object?> Getter);
public static class TsetmcFieldRegistry
{
    private static readonly Dictionary<string,TsetmcFieldDefinition> Fields=Build();
    public static bool TryGet(string code,out TsetmcFieldDefinition def)=>Fields.TryGetValue(code,out def!);
    public static IReadOnlyCollection<TsetmcFieldDefinition> All=>Fields.Values;
    private static Dictionary<string,TsetmcFieldDefinition> Build()
    {
        var d=new Dictionary<string,TsetmcFieldDefinition>(StringComparer.OrdinalIgnoreCase);
        void Add(string c,string n,string fa,Func<MarketSymbolSnapshot,object?> g)=>d[c]=new(c,n,fa,g);
        Add("l18","TsetmcSymbol","نماد",x=>string.IsNullOrEmpty(x.TsetmcSymbol)?x.Symbol:x.TsetmcSymbol); Add("l30","TsetmcName","نام",x=>string.IsNullOrEmpty(x.TsetmcName)?x.SymbolName:x.TsetmcName); Add("tno","TradeCount","تعداد معاملات",x=>x.TradeCount); Add("tvol","TradeVolume","حجم معاملات",x=>x.TradeVolume); Add("tval","TradeValue","ارزش معاملات",x=>x.TradeValue);
        Add("py","YesterdayPrice","قیمت دیروز",x=>x.YesterdayPrice); Add("pf","FirstPrice","اولین قیمت",x=>x.FirstPrice); Add("pmin","MinPrice","کمترین قیمت",x=>x.MinPrice); Add("pmax","MaxPrice","بیشترین قیمت",x=>x.MaxPrice); Add("pl","LastPrice","آخرین قیمت",x=>x.LastPrice); Add("plc","LastPriceChange","تغییر آخرین قیمت",x=>x.PriceChange); Add("plp","LastPricePercent","درصد تغییر آخرین قیمت",x=>x.LastPricePercent); Add("pc","ClosingPrice","قیمت پایانی",x=>x.ClosingPrice); Add("pcc","ClosingPriceChange","تغییر قیمت پایانی",x=>x.ClosingPriceChange); Add("pcp","ClosingPricePercent","درصد تغییر قیمت پایانی",x=>x.ClosingPricePercent);
        Add("eps","Eps","EPS",x=>x.Eps); Add("pe","PE","P/E",x=>x.PE); Add("tmin","MinAllowedPrice","آستانه مجاز پایین",x=>x.MinAllowedPrice); Add("tmax","MaxAllowedPrice","آستانه مجاز بالا",x=>x.MaxAllowedPrice); Add("z","SharesCount","تعداد سهام",x=>x.SharesCount); Add("mv","MarketValue","ارزش بازار",x=>x.MarketValue); Add("bvol","BaseVolume","حجم مبنا",x=>x.BaseVolume); Add("cs","IndustryCode","گروه صنعت",x=>x.IndustryCode); Add("buyop","OpenPositions","موقعیت‌های باز",x=>x.OpenPositions); Add("predtran","NavCancellation","NAV ابطال",x=>x.NavCancellation);
        for(var i=1;i<=5;i++){var idx=i-1;Add($"pd{i}",$"BuyPrice{i}",$"قیمت خرید سطر {i}",x=>x.OrderBook[idx].BuyPrice);Add($"zd{i}",$"BuyCount{i}",$"تعداد خریدار سطر {i}",x=>x.OrderBook[idx].BuyCount);Add($"qd{i}",$"BuyVolume{i}",$"حجم خرید سطر {i}",x=>x.OrderBook[idx].BuyVolume);Add($"po{i}",$"SellPrice{i}",$"قیمت فروش سطر {i}",x=>x.OrderBook[idx].SellPrice);Add($"zo{i}",$"SellCount{i}",$"تعداد فروشنده سطر {i}",x=>x.OrderBook[idx].SellCount);Add($"qo{i}",$"SellVolume{i}",$"حجم فروش سطر {i}",x=>x.OrderBook[idx].SellVolume);}
        Add("ct","ClientType","حقیقی و حقوقی",x=>x.ClientType); return d;
    }
}
