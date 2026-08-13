from pathlib import Path
import json,re,sys

r=Path(__file__).resolve().parents[1]
required=[
 'Backend/Platform/src/TSEAI.Application/Temporal/TemporalContracts.cs',
 'Backend/Platform/src/TSEAI.Application/Temporal/PersianTemporalNormalizer.cs',
 'Backend/Platform/src/TSEAI.Application/Temporal/PersianNumberParser.cs',
 'Backend/Platform/src/TSEAI.Application/Temporal/PersianTemporalResolver.cs',
 'Backend/Platform/tests/TSEAI.Temporal.SmokeTests/TSEAI.Temporal.Smoke.csproj',
 'Backend/Platform/tests/TSEAI.Temporal.SmokeTests/Program.cs',
 'docs/ADR/0006-persian-temporal-intelligence.md',
 'docs/SPRINT14.md','docs/SPRINT14-VALIDATION.md',
 'tests/temporal-resolution-cases.json','TSEAI.Sprint14.Manifest.md'
]
missing=[x for x in required if not (r/x).exists()]
if missing:
    print('missing',missing);sys.exit(1)

contracts=(r/required[0]).read_text(encoding='utf-8')
normalizer=(r/required[1]).read_text(encoding='utf-8')
number=(r/required[2]).read_text(encoding='utf-8')
resolver=(r/required[3]).read_text(encoding='utf-8')
chat=(r/'Backend/Platform/src/TSEAI.Application/Chat/ChatOrchestrator.cs').read_text(encoding='utf-8')
chat_contracts=(r/'Backend/Platform/src/TSEAI.Application/Chat/ChatContracts.cs').read_text(encoding='utf-8')
policy=(r/'Backend/Platform/src/TSEAI.Application/Chat/Agentic/ChatToolPolicy.cs').read_text(encoding='utf-8')
di=(r/'Backend/Platform/src/TSEAI.Infrastructure/DependencyInjection.cs').read_text(encoding='utf-8')
api=(r/'Backend/Platform/src/TSEAI.Api/Program.cs').read_text(encoding='utf-8')
release=(r/'scripts/release-gate.sh').read_text(encoding='utf-8')
release_cmd=(r/'scripts/RELEASE-GATE.cmd').read_text(encoding='utf-8')
solution=(r/'TSEAI.sln').read_text(encoding='utf-8')
cases=json.loads((r/'tests/temporal-resolution-cases.json').read_text(encoding='utf-8'))
case_texts={x['text'] for x in cases['cases']}

mandatory={
 'امروز','فردا','پس فردا','دیروز','پریروز','4روز بعد','چهار روز بعد',
 '20/05/1405','1405/05/20','20 مرداد 1405','بیست مرداد 1405','بیستم مرداد 1405',
 'از 10 مرداد تا 20 مرداد 1405','این هفته','هفته قبل','ماه جاری','ماه گذشته','7 روز اخیر'
}

checks={
 'files':not missing,
 'case-count':len(cases['cases'])>=20,
 'mandatory-cases':mandatory.issubset(case_texts),
 'contract-interface':'interface IPersianTemporalResolver' in contracts,
 'contract-status':'TemporalResolutionStatus' in contracts and 'MarketDayKind' in contracts,
 'timezone-contract':'string TimeZoneId' in contracts and 'Asia/Tehran' in resolver,
 'persian-calendar':'PersianCalendar' in resolver,
 'digit-normalization':all(x in normalizer for x in ['۰','۹','٠','٩']),
 'character-normalization':"'ي' => 'ی'" in normalizer and "'ك' => 'ک'" in normalizer,
 'number-words':all(x in number for x in ['چهار','بیست','بیستم','سی']),
 'relative-rules':all(x in resolver for x in ['relative.today','relative.tomorrow','relative.yesterday','relative.offset_days']),
 'range-rules':all(x in resolver for x in ['range.explicit','range.current_week','range.previous_month','range.recent_days']),
 'month-names':all(x in resolver for x in ['فروردین','مرداد','اسفند']),
 'weekend-policy':'DayOfWeek.Thursday' in resolver and 'DayOfWeek.Friday' in resolver,
 'holiday-fail-honest':'HolidayCalendarEvaluated: false' in resolver,
 'no-datetime-guess':not re.search(r'DateTime\.(TryParse|Parse)\s*\(',resolver),
 'no-ai-http-in-resolver':all(x not in resolver for x in ['HttpClient','IAi','LLM','OpenAI']),
 'di':'IPersianTemporalResolver, PersianTemporalResolver' in di and 'IClock, SystemClock' in di,
 'tool-policy':'"temporal.resolve"' in policy,
 'chat-temporal':'TemporalResolution Temporal' in chat_contracts and ('temporal.Resolve(request.Question)' in chat or 'conversationTemporal.ResolveAsync' in chat),
 'chat-history-guard':'MarketDailyHistory' in chat and 'temporal_unavailable' in chat,
 'future-no-fabrication':'داده بازار آینده را به‌عنوان واقعیت تولید نمی‌کند' in chat,
 'api-endpoint':'/api/temporal/resolve' in api,
 'sprint14-root':bool(re.search(r'sprint\s*=\s*(?:1[4-9]|[2-9]\d)',api)),
 'version':bool(re.fullmatch(r'1\.0\.0-rc\.(?:[3-9]|[1-9]\d+)',(r/'VERSION').read_text().strip())),
 'smoke-in-solution':'TSEAI.Temporal.Smoke' in solution,
 'smoke-release-gate':'run-dotnet-smoke.py' in release and 'validate-sprint14.py' in release,
 'windows-smoke-release-gate':'run-dotnet-smoke.py' in release_cmd and 'validate-sprint14.py' in release_cmd,
}
for k,v in checks.items(): print(k,'OK' if v else 'FAIL')
sys.exit(0 if all(checks.values()) else 1)
