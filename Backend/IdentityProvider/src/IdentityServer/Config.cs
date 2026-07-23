using IdentityServer4;
using IdentityServer4.Models;
using Microsoft.Extensions.Configuration;
using Share.Domain.Constants;
using System;
using System.Collections.Generic;
using System.Linq;
namespace IdentityServer
{
    public class Config
    {
        public static IEnumerable<Client> GetClients(IConfiguration configuration)
        {

            return new Client[]
     {
            new Client
            {
                ClientId = "CMSClient",
                ClientName = "پنل تولید محتوا",
                RequirePkce = true,
                //ClientSecrets=new Secret[]{new Secret("T$e.!R*CMSClient*E@M@M@A@M".Sha256()) },
                RequireClientSecret=false,
                AllowedGrantTypes = GrantTypes.Code,
                //RequirePkce=true,
                AllowOfflineAccess =false,// true,
                AbsoluteRefreshTokenLifetime=60*15,//60*60*4,  //configuration["IdentityServer:AbsoluteRefreshTokenLifetime"].ToInt()??1000,
                //AllowAccessTokensViaBrowser = true,
                //AlwaysIncludeUserClaimsInIdToken=true,
                //RequireConsent = false,
                AccessTokenLifetime =60*15,// 60*60,
                RedirectUris = {
                    configuration["IdentityServer:CMSRedirectUriCallback"],
                },
                PostLogoutRedirectUris =
                {
                    configuration["IdentityServer:CMSPostLogoutRedirectUri"]
                },
                AllowedCorsOrigins = configuration["IdentityServer:AllowedCorsOrigins"].ToString().Split(",").Select(s => s.Trim()).ToList(),
                AllowedScopes =
                {
                    IdentityServerConstants.StandardScopes.OpenId,
                    IdentityServerConstants.StandardScopes.Profile,
                    "Content_Producer",
                },
            },
                       new Client
            {
                ClientId = "CMSClient2",
                ClientName = "2پنل تولید محتوا",
                RequirePkce = true,
                //ClientSecrets=new Secret[]{new Secret("T$e.!R*CMSClient*E@M@M@A@M".Sha256()) },
                RequireClientSecret=false,
                AllowedGrantTypes = GrantTypes.Code,
                //RequirePkce=true,
                AllowOfflineAccess =false,// true,
                AbsoluteRefreshTokenLifetime=60*15,//60*60*4,  //configuration["IdentityServer:AbsoluteRefreshTokenLifetime"].ToInt()??1000,
                //AllowAccessTokensViaBrowser = true,
                //AlwaysIncludeUserClaimsInIdToken=true,
                //RequireConsent = false,
                AccessTokenLifetime =60*15,// 60*60,
                RedirectUris = {
                    configuration["IdentityServer:CMSRedirectUriCallback2"],
                },
                PostLogoutRedirectUris =
                {
                    configuration["IdentityServer:CMSPostLogoutRedirectUri2"]
                },
                AllowedCorsOrigins = configuration["IdentityServer:AllowedCorsOrigins"].ToString().Split(",").Select(s => s.Trim()).ToList(),
                AllowedScopes =
                {
                    IdentityServerConstants.StandardScopes.OpenId,
                    IdentityServerConstants.StandardScopes.Profile,
                    "Content_Producer",
                },
            },
             new Client
            {
                ClientId = "MarketMakerClient",
                ClientName = "بازار گردان",
                RequirePkce = true,
                //ClientSecrets=new Secret[]{new Secret("T$e.!R*MarketMakerClient*E@M@M@A@M".Sha256()) },
                RequireClientSecret=false,
                AllowedGrantTypes = GrantTypes.Code,
                //RequirePkce=true,
                AllowOfflineAccess = false,//true,
                AbsoluteRefreshTokenLifetime=60*15,//60*60*4,  //configuration["IdentityServer:AbsoluteRefreshTokenLifetime"].ToInt()??1000,
               // AllowAccessTokensViaBrowser = true,
                //AlwaysIncludeUserClaimsInIdToken=true,
                //RequireConsent = false,
                AccessTokenLifetime =60*15,// 60*60,
                RedirectUris = {
                    configuration["IdentityServer:MarketMakerRedirectUriCallback"],
                },
                PostLogoutRedirectUris =
                {
                  configuration["IdentityServer:MarketMakerPostLogoutRedirectUri"]
                },
                AllowedCorsOrigins = configuration["IdentityServer:AllowedCorsOrigins"].ToString().Split(",").Select(s => s.Trim()).ToList(),
                AllowedScopes =
                {
                    IdentityServerConstants.StandardScopes.OpenId,
                    IdentityServerConstants.StandardScopes.Profile,
                    "Content_Producer",
                },

            },
             new Client
            {
                ClientId = "CashMarketClient",
                ClientName = "بازار نقد",
                RequirePkce = true,
                RequireClientSecret=false,
                AllowedGrantTypes = GrantTypes.Code,
                AllowOfflineAccess = true,
                AbsoluteRefreshTokenLifetime=60*60*4,
                AccessTokenLifetime = 60*60,
                RedirectUris = {
                    configuration["IdentityServer:CashMarketRedirectUriCallback"],
                },
                PostLogoutRedirectUris =
                {
                  configuration["IdentityServer:CashMarketPostLogoutRedirectUri"]
                },
                AllowedCorsOrigins = configuration["IdentityServer:AllowedCorsOrigins"].ToString().Split(",").Select(s => s.Trim()).ToList(),
                AllowedScopes =
                {
                    IdentityServerConstants.StandardScopes.OpenId,
                    IdentityServerConstants.StandardScopes.Profile,
                    "Content_Producer",
                },

            },
            new Client
            {
               ClientId = "TaxClient",
                ClientName = "Tax",
                RequirePkce = true,
                RequireClientSecret=false,
                AllowedGrantTypes = GrantTypes.Code,
                AllowOfflineAccess = true,
                AccessTokenLifetime = 60*60*5,
                RedirectUris = {
                    configuration["IdentityServer:TaxRedirectUriCallback"],
                },
                PostLogoutRedirectUris =
                {
                  configuration["IdentityServer:TaxPostLogoutRedirectUri"]
                },
                AllowedCorsOrigins = configuration["IdentityServer:AllowedCorsOrigins"].ToString().Split(",").Select(s => s.Trim()).ToList(),
                AllowedScopes =
                {
                    IdentityServerConstants.StandardScopes.OpenId,
                    IdentityServerConstants.StandardScopes.Profile,
                    "Content_Producer",
                },
            },
             new Client
            {
                ClientId = "RegionHallClient",
                ClientName = "تالار مناطق",
                RequirePkce = true,
                RequireClientSecret=false,
                AllowedGrantTypes = GrantTypes.Code,
                AllowOfflineAccess = true,
                AccessTokenLifetime = 60*30,
                RedirectUris = {
                    configuration["IdentityServer:RegionHallRedirectUriCallback"],
                },
                PostLogoutRedirectUris =
                {
                  configuration["IdentityServer:RegionHallPostLogoutRedirectUri"]
                },
                AllowedCorsOrigins = configuration["IdentityServer:AllowedCorsOrigins"].ToString().Split(",").Select(s => s.Trim()).ToList(),
                AllowedScopes =
                {
                    IdentityServerConstants.StandardScopes.OpenId,
                    IdentityServerConstants.StandardScopes.Profile,
                    "Content_Producer",
                },

            },
             new Client
            {
                ClientId = "HealanClient",
                ClientName = "پذیرش",
                RequirePkce = true,
                //ClientSecrets=new Secret[]{new Secret("T$e.!R*CMSClient*E@M@M@A@M".Sha256()) },
                RequireClientSecret=false,
                AllowedGrantTypes = GrantTypes.Code,
                //RequirePkce=true,
                AllowOfflineAccess = true,
                AbsoluteRefreshTokenLifetime=60*60*4,  //configuration["IdentityServer:AbsoluteRefreshTokenLifetime"].ToInt()??1000,
                SlidingRefreshTokenLifetime = 0,
                //AllowAccessTokensViaBrowser = true,
                //AlwaysIncludeUserClaimsInIdToken=true,
                //RequireConsent = false,
                AccessTokenLifetime = 60*60,
                RedirectUris = configuration["IdentityServer:HealanRedirectUriCallback"]
                    .ToString().Split(',').Select(s => s.Trim()).Where(s => !string.IsNullOrEmpty(s)).ToList(),
                PostLogoutRedirectUris = configuration["IdentityServer:HealanPostLogoutRedirectUri"]
                    .ToString().Split(',').Select(s => s.Trim()).Where(s => !string.IsNullOrEmpty(s)).ToList(),
                AllowedCorsOrigins = configuration["IdentityServer:AllowedCorsOrigins"].ToString().Split(",").Select(s => s.Trim()).ToList(),
                AllowedScopes =
                {
                    IdentityServerConstants.StandardScopes.OpenId,
                    IdentityServerConstants.StandardScopes.Profile,
                    "Content_Producer",
                },
            },
            new Client
            {
                ClientId = "HealanImpersonationClient",
                ClientName = "Healan secure impersonation exchange",
                RequireClientSecret = false,
                AllowedGrantTypes = { Services.ImpersonationGrantValidator.GrantTypeName },
                AllowOfflineAccess = false,
                AccessTokenLifetime = 60 * 5,
                AllowedCorsOrigins = configuration["IdentityServer:AllowedCorsOrigins"]
                    .ToString().Split(",").Select(s => s.Trim()).ToList(),
                AllowedScopes =
                {
                    "Content_Producer",
                },
            },
            new Client
            {
                ClientId = "HealanClinicMobile",
                ClientName = "اپ اندروید پذیرش Healan",
                RequirePkce = true,
                RequireClientSecret = false,
                AllowedGrantTypes = GrantTypes.Code,
                AllowOfflineAccess = true,
                AbsoluteRefreshTokenLifetime = 60 * 60 * 24 * 7,
                SlidingRefreshTokenLifetime = 0,
                AccessTokenLifetime = 60 * 60,
                RedirectUris = (configuration["IdentityServer:HealanClinicMobileRedirectUriCallback"] ?? "")
                    .ToString().Split(',').Select(s => s.Trim()).Where(s => !string.IsNullOrEmpty(s)).ToList(),
                PostLogoutRedirectUris = (configuration["IdentityServer:HealanClinicMobilePostLogoutRedirectUri"]
                        ?? configuration["IdentityServer:HealanClinicMobileRedirectUriCallback"]
                        ?? "")
                    .ToString().Split(',').Select(s => s.Trim()).Where(s => !string.IsNullOrEmpty(s)).ToList(),
                AllowedCorsOrigins = configuration["IdentityServer:AllowedCorsOrigins"]
                    .ToString().Split(",").Select(s => s.Trim()).ToList(),
                AllowedScopes =
                {
                    IdentityServerConstants.StandardScopes.OpenId,
                    IdentityServerConstants.StandardScopes.Profile,
                    IdentityServerConstants.StandardScopes.OfflineAccess,
                    "Content_Producer",
                },
            },
     };
        }

        public static IEnumerable<ApiScope> ApiScopes => new ApiScope[]{
            new ApiScope("Admin", "Administrator"),
            new ApiScope("Content_Producer", "چهارچوب تولید محتوا"),
            new ApiScope("UserInfo","اطلاعات کاربری"),
            new ApiScope("Samab", "اطلاعات بازار"),
            new ApiScope("SiteInfo", "اطلاعات سایت")
        };


        public static IEnumerable<ApiResource> ApiResources => new[]{
            new ApiResource
            {
                Name = "CMSWebApi",
                DisplayName = "سرویس مدیریت محتوا",
                Scopes = new List<string> {"Content_Producer"},
                ApiSecrets = new List<Secret> {new Secret("T$e.!R*CMSWebApi*E@M@M@A@M".Sha256())},
                UserClaims = new List<string> {"role"}
            },
            new ApiResource
            {
                Name = "FileManagerWebApi",
                DisplayName = "سرویس مدیریت فایل",
                Scopes = new List<string> {"Content_Producer"},
                ApiSecrets = new List<Secret> {new Secret("T$e.!R*FileManagerWebApi*E@M@M@A@M".Sha256())},
                UserClaims = new List<string> {"role"}
            },
            new ApiResource
            {
                Name = "SarvinWebApi",
                DisplayName = "سرویس فراهم کننده اطلاعات بازار",
                Scopes = new List<string> {"Samab"},
                ApiSecrets = new List<Secret> {new Secret("T$e.!R*SarvinWebApi*E@M@M@A@M".Sha256())},
                UserClaims = new List<string> {"role"}
            },
            new ApiResource
            {
                Name = "SiteApi",
                DisplayName = "سرویس سایت",
                Scopes = new List<string> {"SiteInfo"},
                ApiSecrets = new List<Secret> {new Secret("T$e.!R*SiteApi*E@M@M@A@M".Sha256())},
                UserClaims = new List<string> {"role"}
            },
                       new ApiResource
            {
                Name = "MarketMakerWebApi",
                DisplayName = "سرویس بازارگردان",
                Scopes = new List<string> {"Content_Producer"},
                ApiSecrets = new List<Secret> {new Secret("T$e.!R*MarketMakerWebApi*E@M@M@A@M".Sha256())},
                UserClaims = new List<string> {"role"}
            },
                       new ApiResource
            {
                Name = "CashMarketWebApi",
                DisplayName = "سرویس بازار نقد",
                Scopes = new List<string> {"Content_Producer"},
                ApiSecrets = new List<Secret> {new Secret("T$e.!R*MarketMakerWebApi*E@M@M@A@M".Sha256())},
                UserClaims = new List<string> {"role"}
            },
             new ApiResource
            {
                Name = "WorkFlowWebApi",
                DisplayName = "سرویس فرایند",
                Scopes = new List<string> {"Content_Producer"},
                ApiSecrets = new List<Secret> {new Secret("T$e.!R*WorkFlowWebApi*E@M@M@A@M".Sha256())},
                UserClaims = new List<string> {"role"}
            },
                  new ApiResource
            {
                Name = "TaxWebApi",
                DisplayName = "سرویس مالیات",
                Scopes = new List<string> {"Content_Producer"},
                ApiSecrets = new List<Secret> {new Secret("T$e.!R*TaxWebApi*E@M@M@A@M".Sha256())},
                UserClaims = new List<string> {"role"}
            },
                             new ApiResource
            {
                Name = "RegionHallWebApi",
                DisplayName = "سرویس مالیات",
                Scopes = new List<string> {"Content_Producer"},
                ApiSecrets = new List<Secret> {new Secret("T$e.!R*RegionHallWebApi*E@M@M@A@M".Sha256())},
                UserClaims = new List<string> {"role"}
            }, new ApiResource
            {
                Name = "HealanWebApi",
                DisplayName = "سرویس پذیرش",
                Scopes = new List<string> {"Content_Producer"},
                ApiSecrets = new List<Secret> {new Secret("T$e.!R*HealanWebApi*E@M@M@A@M".Sha256())},
                UserClaims = new List<string>
                {
                    "role",
                    WellKnownNames.DepartmentClaimName,
                    ImpersonationClaimNames.ActorSubject,
                    ImpersonationClaimNames.IsImpersonating,
                    ImpersonationClaimNames.SessionId,
                }
            }
        };

        public static IEnumerable<IdentityResource> IdentityResources => new IdentityResource[]{
            new IdentityResources.OpenId(),
            new IdentityResources.Profile()
        };
    }
}