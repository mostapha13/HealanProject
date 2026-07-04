using Share.Application.Common.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Infrastructure.Services
{
    public class NationalCodeValidation : INationalCodeValidation
    {
        public async Task<bool> IsMatch(string nationalCode, string phoneNumber)
        {
            return true;
        }
    }
}
