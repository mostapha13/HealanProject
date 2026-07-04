using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Application.Common.Interfaces
{
    public interface ITokenService
    {
        Task<string> GenerateToken(string userId, bool isRefreshToken = false);
        Task<string> ValidateToken(string token);
    }
}
