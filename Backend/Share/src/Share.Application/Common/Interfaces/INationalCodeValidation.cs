using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Application.Common.Interfaces
{
    public interface INationalCodeValidation
    {
        Task<bool> IsMatch(string nationalCode, string phoneNumber);
    }
}
