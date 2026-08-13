from pathlib import Path
import json,re,sys
r=Path(__file__).resolve().parents[1]
required=[
 'Backend/Platform/src/TSEAI.Application/Analytics/MarketAnalyticsContracts.cs',
 'Backend/Platform/src/TSEAI.Application/Analytics/DeterministicMarketAnalyticsEngine.cs',
 'Backend/Platform/tests/TSEAI.MarketAnalytics.SmokeTests/TSEAI.MarketAnalytics.Smoke.csproj',
 'Backend/Platform/tests/TSEAI.MarketAnalytics.SmokeTests/Program.cs',
 'docs/ADR/0010-deterministic-market-analytics.md','docs/SPRINT18.md','docs/SPRINT18-VALIDATION.md',
 'tests/market-analytics-cases.json','TSEAI.Sprint18.Manifest.md'
]
missing=[x for x in required if not (r/x).exists()]
contracts=(r/required[0]).read_text(encoding='utf-8') if not missing else ''
engine=(r/required[1]).read_text(encoding='utf-8') if not missing else ''
tools=(r/'Backend/Platform/src/TSEAI.Application/Tools/StructuredToolContracts.cs').read_text(encoding='utf-8')
gateway=(r/'Backend/Platform/src/TSEAI.Infrastructure/Tools/SecureStructuredToolGateway.cs').read_text(encoding='utf-8')
chat=(r/'Backend/Platform/src/TSEAI.Application/Chat/ChatOrchestrator.cs').read_text(encoding='utf-8')
di=(r/'Backend/Platform/src/TSEAI.Infrastructure/DependencyInjection.cs').read_text(encoding='utf-8')
api=(r/'Backend/Platform/src/TSEAI.Api/Program.cs').read_text(encoding='utf-8')
cases=json.loads((r/'tests/market-analytics-cases.json').read_text(encoding='utf-8'))['cases'] if not missing else []
checks={
 'files':not missing,
 'contracts':all(x in contracts for x in ['TradingPowerAnalytics','OrderBookAnalytics','VolumeAnalytics','PricePositionAnalytics','MarketBreadthAnalytics','SymbolMarketAnalytics','IMarketAnalyticsEngine']),
 'formulas':all(x in engine for x in ['BuyIVolume - c.SellIVolume','BuyNVolume - c.SellNVolume','buyPc.Value!.Value / sellPc.Value!.Value','ask.Value!.Value - bid.Value!.Value','totalBid.Value!.Value - totalAsk.Value!.Value','s.TradeVolume / s.BaseVolume.Value']),
 'no-month-fabrication':'monthly_average_volume_source_not_available' in engine,
 'zero-safe':'individual_buy_count_is_zero' in engine and 'individual_sell_count_is_zero' in engine and 'order_book_total_volume_is_zero' in engine,
 'tools':all(x in tools for x in ['market.get_trading_power','market.get_orderbook_analysis','market.get_volume_analysis','market.get_price_position','market.get_market_breadth','market.get_symbol_analytics']),
 'gateway':'analytics.AnalyzeSymbol' in gateway and 'EvaluateMarketSnapshot' in gateway and 'CanUseForAnswer' in gateway,
 'chat':'analyticsEngine.AnalyzeSymbol' in chat and 'analytics.symbol' in chat,
 'di':'IMarketAnalyticsEngine, DeterministicMarketAnalyticsEngine' in di,
 'no-arbitrary':not re.search(r'\b(UPDATE|INSERT|DELETE|MERGE|TRUNCATE|EXEC\s*\()\b',engine,re.I),
 'api':bool(re.search(r'sprint\s*=\s*(?:1[89]|[2-9][0-9])', api)),
 'version':bool(re.fullmatch(r'1\.0\.0-rc\.(?:[7-9]|[1-9][0-9]+)', (r/'VERSION').read_text().strip())),
 'cases':len(cases)>=12 and any(x['name']=='volume_vs_monthly_average' for x in cases),
}
for k,v in checks.items(): print(k,'OK' if v else 'FAIL')
sys.exit(0 if all(checks.values()) else 1)
