using TSEAI.Application.Chat.Context;
using TSEAI.Application.Temporal;
using TSEAI.Shared.Application;

var clock=new FixedClock(new DateTimeOffset(2026,8,11,8,0,0,TimeSpan.Zero));
var temporal=new PersianTemporalResolver(clock);
var store=new MemoryStore();
var resolver=new ConversationTemporalContextResolver(store,temporal);

store.State=State("2026-08-01","1405/05/10");
var after=await resolver.ResolveAsync("u","c","یک روز بعدش",default);
Must(after.ContextApplied && after.Primary.Start?.GregorianIso=="2026-08-02","contextual next day");
Must(after.Primary.ReferenceDate.GregorianIso=="2026-08-11","context result must be rebased to real clock");

var before=await resolver.ResolveAsync("u","c","سه روز قبلش",default);
Must(before.Primary.Start?.GregorianIso=="2026-07-29",$"contextual previous days; actual={before.Primary.Start?.GregorianIso}; rule={before.Primary.Rule}; audit={before.AuditSummary}");

var same=await resolver.ResolveAsync("u","c","همون روز",default);
Must(same.Primary.Start?.GregorianIso=="2026-08-01","same day reuse");

var explicitYesterday=await resolver.ResolveAsync("u","c","دیروز",default);
Must(!explicitYesterday.ContextApplied && explicitYesterday.Primary.Start?.GregorianIso=="2026-08-10","plain yesterday uses clock, not conversation anchor");

store.State=ConversationContextState.Empty("c");
var missing=await resolver.ResolveAsync("u","c","یک روز قبلش",default);
Must(missing.Primary.Status==TemporalResolutionStatus.Ambiguous && missing.Primary.Rule=="context.anchor_missing","missing anchor must fail closed");

var comparison=await resolver.ResolveAsync("u","c","امروز رو با دیروز مقایسه کن",default);
Must(comparison.IsComparison,"temporal comparison detected");
Must(comparison.Primary.Start?.GregorianIso=="2026-08-11","comparison primary today");
Must(comparison.Comparison?.Start?.GregorianIso=="2026-08-10","comparison secondary yesterday");

store.State=State("2026-08-11","1405/05/20");
var future=await resolver.ResolveAsync("u","c","سه روز بعدش",default);
Must(future.Primary.Start?.GregorianIso=="2026-08-14" && future.Primary.IsFuture,"future contextual date classified against actual clock");

Console.WriteLine("TSEAI temporal conversation smoke PASS");

static ConversationContextState State(string greg,string jalali)
    => new("c",null,null,null,null,new ConversationTemporalReference("anchor",jalali,jalali,greg,greg,"ExactDate"),"q",1,DateTimeOffset.UtcNow);
static void Must(bool ok,string msg){if(!ok)throw new Exception(msg);}
sealed class FixedClock(DateTimeOffset utc):IClock { public DateTimeOffset UtcNow=>utc; }
sealed class MemoryStore:IConversationContextStore
{
    public ConversationContextState State=ConversationContextState.Empty("c");
    public Task<ConversationContextState> GetAsync(string s,string c,CancellationToken ct)=>Task.FromResult(State);
    public Task SaveAsync(string s,ConversationContextState state,CancellationToken ct){State=state;return Task.CompletedTask;}
    public Task ClearAsync(string s,string c,CancellationToken ct){State=ConversationContextState.Empty(c);return Task.CompletedTask;}
}
