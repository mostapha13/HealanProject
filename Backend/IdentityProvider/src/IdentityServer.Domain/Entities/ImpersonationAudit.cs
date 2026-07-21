namespace IdentityServer.Domain.Entities
{
    public class ImpersonationAudit
    {
        public long ImpersonationAuditId { get; set; }
        public Guid ActorUserId { get; set; }
        public Guid TargetUserId { get; set; }
        public Guid SessionId { get; set; }
        public DateTime OccurredAtUtc { get; set; }
        public string IpAddress { get; set; } = string.Empty;
        public string Event { get; set; } = string.Empty;
    }
}
