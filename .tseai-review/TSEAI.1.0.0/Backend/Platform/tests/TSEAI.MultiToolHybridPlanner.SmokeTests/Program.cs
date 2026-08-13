using TSEAI.Application.Chat;
using TSEAI.Application.Chat.Routing;

static void Assert(bool ok,string message){if(!ok)throw new Exception(message);}
var route=new CapabilityRouteDecision(
    ChatCapabilityRoute.Hybrid,ChatIntent.Hybrid,.92,["test"],
    [new("entity.resolve","sql-ai-reference"),new("structured.market.symbol","canonical-market-snapshot"),new("knowledge.retrieve","qdrant-grounded-evidence"),new("analytics.symbol","deterministic-calculation",false)],
    new ChatPlan(ChatIntent.Hybrid,"فولاد","آخرین خبر فولاد",.92,null,["test"]),PlannerUsed:true);
var plan=new DeterministicMultiToolHybridPlanner().Build(route);
Assert(plan.Steps.Count==4,"expected four bounded steps");
Assert(plan.MaxParallelism==2,"parallelism must be bounded");
var entity=plan.Steps.Single(x=>x.Id=="entity");
var market=plan.Steps.Single(x=>x.Id=="market");
var knowledge=plan.Steps.Single(x=>x.Id=="knowledge");
var analytics=plan.Steps.Single(x=>x.Id=="analytics");
Assert(entity.DependsOn.Count==0,"entity must be root");
Assert(market.DependsOn.SequenceEqual(["entity"]),"market dependency invalid");
Assert(knowledge.DependsOn.SequenceEqual(["entity"]),"knowledge dependency invalid");
Assert(analytics.DependsOn.SequenceEqual(["market"]),"analytics dependency invalid");
Assert(plan.AuditSummary.Contains("knowledge.retrieve") && plan.AuditSummary.Contains("analytics.symbol"),"audit summary incomplete");
Console.WriteLine("TSEAI Multi-Tool Hybrid Planner smoke PASS");
