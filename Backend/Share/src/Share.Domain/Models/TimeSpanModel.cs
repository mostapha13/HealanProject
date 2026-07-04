using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Models
{
    public class TimeSpanModel : IComparable<TimeSpanModel>
    {
        public int Hours { get; set; }
        public int Minutes { get; set; }
        public int Seconds { get; set; }

        public int CompareTo(TimeSpanModel other)
        {
            if (this.Hours > other.Hours || (this.Hours == other.Hours && this.Minutes > other.Minutes) || (this.Hours == other.Hours && this.Minutes == other.Minutes && this.Minutes > other.Minutes))
                return 1;
            else if (this.Hours < other.Hours || (this.Hours == other.Hours && this.Minutes < other.Minutes) || (this.Hours == other.Hours && this.Minutes == other.Minutes && this.Minutes < other.Minutes))
                return -1;
            return 0;
        }

        public TimeSpan ToTimeSpan()
        {
            return new TimeSpan(Hours, Minutes, Seconds);
        }
        public override string ToString()
        {
            return $"{Hours}:{Minutes}";
        }
    }
}
