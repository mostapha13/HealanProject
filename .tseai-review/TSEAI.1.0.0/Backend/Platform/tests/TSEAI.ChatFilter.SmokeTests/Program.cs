using TSEAI.Application.Filters.Chat;
using TSEAI.Application.Filters.Parsing;
using TSEAI.Application.Filters.Validation;

static void Assert(bool value,string message){if(!value)throw new Exception(message);}
var d=new DeterministicChatFilterIntentDetector();
var raw=d.Detect("(pl)==(tmax) && (qd1)>=200000000"); Assert(raw.IsFilter&&raw.IsDirectDsl&&!raw.RequiresHistory,"raw DSL detection");
var wrapped=d.Detect("فیلتر کن (pl)>(pc)"); Assert(wrapped.IsFilter&&wrapped.IsDirectDsl,"wrapped DSL detection");
Assert(DeterministicChatFilterIntentDetector.ExtractDsl("فیلتر کن (pl)>(pc)")=="(pl)>(pc)","DSL extraction");
var nl=d.Detect("صف خریدها رو فیلتر کن"); Assert(nl.IsFilter&&!nl.IsDirectDsl,"natural-language filter detection");
Assert(!d.Detect("قیمت فولاد چنده؟").IsFilter,"single symbol must not be intercepted");
Assert(!d.Detect("۱۰ نماد با بیشترین حجم معاملات").IsFilter,"structured query must not be intercepted");
var hist=d.Detect("([ih][0].QTotTran5J)>1000"); Assert(hist.IsFilter&&hist.RequiresHistory,"history fail-closed detection");
var parser=new TsetmcFilterParser(); var validator=new FilterValidator();
var valid=validator.Validate(parser.Parse("(pl)==(tmax) && (qd1)>=200000000")); Assert(valid.IsValid,"known TSETMC DSL must validate");
var invalid=validator.Validate(parser.Parse("(evil)>0")); Assert(!invalid.IsValid,"unknown field must fail validation");
Console.WriteLine("Sprint 20 chat-filter smoke PASS");
