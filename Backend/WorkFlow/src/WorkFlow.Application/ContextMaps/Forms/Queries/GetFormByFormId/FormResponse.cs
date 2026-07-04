using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WorkFlow.Application.ContextMaps.Forms.Queries.GetFormByFormId
{
    public class FormResponse
    {
        public int FormId { get; set; }
        public string FormName { get; set; }
        public string FormUrl { get; set; }
        public string ForwardClass { get; set; }
        public string BackwardClass { get; set; }
    }
}
