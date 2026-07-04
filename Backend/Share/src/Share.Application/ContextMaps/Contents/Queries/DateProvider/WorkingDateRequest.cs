using System;

namespace Share.Application.ContextMaps.Contents.Queries.DateProvider
{
    public class WorkingDateRequest
    {
        public DateTime? BaseDateTime { get; set; }
        public int NextWorkingDayLater { get; set; }
    }
}
