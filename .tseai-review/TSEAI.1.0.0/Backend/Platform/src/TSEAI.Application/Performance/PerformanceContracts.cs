namespace TSEAI.Application.Performance;
public sealed record PerformancePolicy(int KnowledgeCacheSeconds=20,int MaxKnowledgeCacheItems=8,int ChatTimeoutSeconds=25,int StructuredTimeoutSeconds=8,int MaxParallelTools=2);
public sealed record PerformanceSnapshot(long KnowledgeCacheHit,long KnowledgeCacheMiss,long RejectedOversizedResult,long Requests,DateTimeOffset GeneratedAtUtc);
public interface IPerformanceTelemetry { void CacheHit(); void CacheMiss(); void Oversized(); void Request(); PerformanceSnapshot Snapshot(); }
public sealed class InMemoryPerformanceTelemetry : IPerformanceTelemetry
{
    private long _hit,_miss,_oversized,_requests;
    public void CacheHit()=>Interlocked.Increment(ref _hit); public void CacheMiss()=>Interlocked.Increment(ref _miss); public void Oversized()=>Interlocked.Increment(ref _oversized); public void Request()=>Interlocked.Increment(ref _requests);
    public PerformanceSnapshot Snapshot()=>new(Interlocked.Read(ref _hit),Interlocked.Read(ref _miss),Interlocked.Read(ref _oversized),Interlocked.Read(ref _requests),DateTimeOffset.UtcNow);
}
