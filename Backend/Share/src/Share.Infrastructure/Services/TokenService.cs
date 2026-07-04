using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Share.Application.Common.Cache;
using Share.Application.Common.Interfaces;
using Share.Application.Common.Models;
using Share.Domain.Extensions;
using Share.Infrastructure.Constant;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Share.Infrastructure.Services
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _configuration;
        private readonly SymmetricSecurityKey secretKey;
        private readonly ICacheManager<SimpleLoginResponse> _cacheManager;
        public TokenService(IConfiguration configuration, ICacheManager<SimpleLoginResponse> cacheManager)
        {
            _configuration = configuration;
            secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(PublicConstant.SecretKey));
            _cacheManager = cacheManager;
        }
        public async Task<string> GenerateToken(string userId, bool isRefreshToken = false)
        {

            var signinCredentials = new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha512);

            var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId)
        };

            var min = _configuration["TokenExpiresTime"].ToInt() ?? 10;
            if (isRefreshToken)
            {
                min = 60 * 24;
            }

            var jwtSecurityToken = new JwtSecurityToken(
                      claims: claims,
                      expires: DateTime.Now.AddMinutes(min),
                      signingCredentials: signinCredentials
                  );
            JwtSecurityTokenHandler jwtSecurityTokenHandler = new JwtSecurityTokenHandler();
            var token = jwtSecurityTokenHandler.WriteToken(jwtSecurityToken);
            return token;
        }

        public async Task<string> ValidateToken(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();



            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer = false,
                ValidateAudience = false,
                RequireExpirationTime = false,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _configuration["BaseUrl"],
                ValidAudience = _configuration["BaseUrl"],
                IssuerSigningKey = secretKey,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(1),
            }, out SecurityToken validatedToken);
            var securityToken = tokenHandler.ReadToken(token) as JwtSecurityToken;

            var body = securityToken.Claims.First(claim => claim.Type == JwtRegisteredClaimNames.Sub).Value;
            if (string.IsNullOrEmpty(body))
                throw new UnauthorizedAccessException("توکن معتبر نیست");

            // var simpleLoginResponse = new SimpleLoginResponse() { token = token, userId = body };
            //var result = await _cacheManager.Get(simpleLoginResponse);
            //if (result == null || !result.IsHit || result.Data.token != token)
            //    throw new UnauthorizedAccessException("توکن معتبر نیست.");
            return body;
        }
    }
}
