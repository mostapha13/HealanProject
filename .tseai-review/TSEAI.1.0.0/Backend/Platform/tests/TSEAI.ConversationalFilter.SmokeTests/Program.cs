using TSEAI.Application.Filters.Chat;
using TSEAI.Application.Filters.Conversation;
static void Assert(bool value,string message){if(!value)throw new Exception(message);}
var d=new DeterministicChatFilterIntentDetector();
Assert(d.Detect("شرط دوم رو حذف کن").IsFilter,"remove condition edit routing");
Assert(d.Detect("P/E رو زیر 5 کن").IsFilter,"field edit routing");
Assert(d.Detect("فیلتر رو توضیح بده").IsFilter,"explain routing");
Assert(d.Detect("همین رو اجرا کن").IsFilter,"execute routing");
var direct=d.Detect("شرط دوم را با (pl) > (pc) جایگزین کن"); Assert(direct.IsFilter&&direct.IsDirectDsl,"direct DSL edit routing");
Assert(DeterministicChatFilterIntentDetector.IsConversationalEdit("شرط دوم را با (pl) > (pc) جایگزین کن"),"DSL edit classification");
Assert(!d.Detect("خبر رو حذف کن").IsFilter,"generic non-filter delete must not be intercepted");
Assert(ConversationFilterOperations.Explain=="explain"&&ConversationFilterOperations.Execute=="execute","operation contracts");
Console.WriteLine("Sprint 21 conversational-filter smoke PASS");
