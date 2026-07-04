using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Enums
{
    public enum ExportDataType:byte
    {
        String=0,
        Percent=1,
        Int = 2,
        Double =3,
        Long=4,
        Decimal=5,
        Date=6,
        DateTime=7,
        Float=8
    }
}
