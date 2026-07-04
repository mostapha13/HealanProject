using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Infrastructure.CustomAttributes
{
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false, Inherited = false)]
    public class AccessFormAttribute : Attribute
    {
        public AccessFormAttribute(params int[] accessFormId)
        {
            AccessFormId = accessFormId;
        }
        public int[] AccessFormId { get; init; }
    }
}
