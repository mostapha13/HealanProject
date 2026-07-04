using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Application.Common.Interfaces
{
    public interface IAbstractSearchRequest
    {
        LanguageId lang { get; set; }
        int PageNumber { get; set; }
        int PageSize { get; set; }
    }
}
