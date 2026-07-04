namespace WorkFlow.Application.ContextMaps.WorkFlowArchives.Queries.GetWorkFlowArchive
{
    public class WorkFlowArchiveResponse
    {
        public string FormName { get; set; }
        public string FormUrl { get; set; }
        public string SenderGroupName { get; set; }
        public string ReceiverGroupName { get; set; }
        public DateTime WorkFlowDate { get; set; }
        public string WorkFlowName { get; set; }
        public string TrackingNumber { get; set; }
        public Guid OrderId { get; set; }
        public string ExtraInfo { get; set; }
    }
}
