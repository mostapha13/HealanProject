using IdentityServer;
using IdentityServer.Application.ContextMaps.Users.ForgetPasswords.Command;
using IdentityServer.Application.ContextMaps.Users.Login.Command;
using IdentityServer.ApplicationPolicy.Services;
using IdentityServer.Domain;
using IdentityServer.Domain.Data;
using IdentityServer.Domain.Entities;
using IdentityServer.Models.AccountViewModels;
using IdentityServer.Quickstart.Account;
using IdentityServer.Services;
using IdentityServer4;
using IdentityServer4.Models;
using IdentityServer4.Services;
using IdentityServer4.Stores;
using IdentityServer4.Test;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;
using Share.Domain.Enums;
using Share.MessageBroker.RabbitMQ.Service;
using System;
using System.Linq;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Threading.Tasks;

namespace IdentityServer.Controllers
{
    [ApiExplorerSettings(IgnoreApi = true)]
    [Authorize]
    [Route("[controller]/[action]")]
    public class AccountController : TseControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly IEmailSender _emailSender;
        private readonly ILogger _logger;
        private readonly IClientStore _clientStore;
        private readonly IIdentityServerInteractionService _interaction;
        private readonly AccountService _account;
        private readonly TestUserStore _users;
        private readonly ApplicationDbContext _applicationDbContext;
        private readonly IConfiguration _configuration;
        private readonly ICaptchaProviderService _captchaProviderService;
        private readonly IMemoryCache _cache;
        private readonly ICacheManager _cacheManager;
        public AccountController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            RoleManager<ApplicationRole> roleManager,
            IEmailSender emailSender,
            ILogger<AccountController> logger,
            IIdentityServerInteractionService interaction,
            IClientStore clientStore,
            IHttpContextAccessor httpContextAccessor,
            IAuthenticationSchemeProvider schemeProvider,
            ApplicationDbContext applicationDbContext,
            TestUserStore users = null
            , IConfiguration configuration = null
, ICaptchaProviderService captchaProviderService = null, IMemoryCache cache = null, ICacheManager cacheManager = null)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _roleManager = roleManager;
            _emailSender = emailSender;
            _logger = logger;
            _clientStore = clientStore;
            _interaction = interaction;
            _users = users;
            _account = new AccountService(interaction, httpContextAccessor, schemeProvider, clientStore);
            _applicationDbContext = applicationDbContext;
            _configuration = configuration;
            _captchaProviderService = captchaProviderService;
            _cache = cache;
            _cacheManager = cacheManager;

        }
        private string GetClinicRedirectUrl()
        {
            var clinicUrl = _configuration["IdentityServer:HealanClinicUrl"];
            if (!string.IsNullOrWhiteSpace(clinicUrl))
                return clinicUrl.TrimEnd('/') + "/";

            // Fallback: first post-logout URI host → clinic root
            var postLogout = _configuration["IdentityServer:HealanPostLogoutRedirectUri"];
            if (!string.IsNullOrWhiteSpace(postLogout))
            {
                var first = postLogout.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).FirstOrDefault();
                if (!string.IsNullOrEmpty(first) && Uri.TryCreate(first, UriKind.Absolute, out var uri))
                    return $"{uri.Scheme}://{uri.Authority}/";
            }

            return "http://clinic.drshahrooei.ir/";
        }

        private async Task<IActionResult> RedirectAfterLoginAsync(string userId, string returnUrl)
        {
            if (!string.IsNullOrEmpty(returnUrl))
            {
                // Complete OIDC authorize round-trip (issues code/token to clinic)
                if (_interaction.IsValidReturnUrl(returnUrl))
                    return Redirect(returnUrl);

                return Redirect(SetCashedValue(userId, returnUrl));
            }

            return Redirect(GetClinicRedirectUrl());
        }

        private string GetCashedValue(string key)
        {

            string val = string.Empty;
            if (_cache.TryGetValue(key, out val))
                return val;
            return string.Empty;
        }
        private string SetCashedValue(string key, string value)
        {

            string val = string.Empty;
            if (_cache.TryGetValue(key, out val))
                RemoveCashedValue(key);
            val = value;
            _cache.Set(key, val, new MemoryCacheEntryOptions() { AbsoluteExpiration = DateTime.Now.AddDays(1), Priority = CacheItemPriority.High });
            return val;
        }

        private void RemoveCashedValue(string key)
        {
            object obj = null;
            if (_cache.TryGetValue(key, out obj))
                _cache.Remove(key);
        }

        [TempData]
        public string ErrorMessage { get; set; }


        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> Login(string ReturnUrl = null)
        {
            // Keep IdentityServer ReturnUrl so authorize can complete after login.
            // Do NOT replace it with client RedirectUri — that skips token issuance.
            string returnUrl = ReturnUrl;
#if !DEBUG
            if (!string.IsNullOrEmpty(ReturnUrl))
            {
                var context = await _interaction.GetAuthorizationContextAsync(ReturnUrl);
                if (context == null)
                {
                    // Plain client URL (not an OIDC interaction returnUrl)
                    ValidateReturnUrl(ReturnUrl);
                }
            }
#endif

            LoginViewModel model = new LoginViewModel() { ReturnUrl = returnUrl, ShowCaptcha = false };

            await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);

            return View(model);
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Login(LoginViewModel model, string returnUrl = null)
        {
            // Captcha is optional on first attempt
            if (!model.ShowCaptcha)
            {
                ModelState.Remove(nameof(model.CaptchaCode));
                ModelState.Remove(nameof(model.CaptchaKey));
            }
            else if (string.IsNullOrWhiteSpace(model.CaptchaCode))
            {
                ModelState.AddModelError(nameof(model.CaptchaCode), "کد کپچا وارد نشده است");
            }

#if DEBUG
            ModelState.Remove(nameof(model.CaptchaCode));
#endif

            var rUrl = !string.IsNullOrEmpty(model.ReturnUrl)
                ? model.ReturnUrl
                : (returnUrl ?? string.Empty);
            if (!string.IsNullOrEmpty(rUrl))
            {
                try { ValidateReturnUrl(rUrl); }
                catch { /* leave validation to RedirectAfterLoginAsync / IsValidReturnUrl */ }
            }
            if (!ModelState.IsValid)
                return View(await FillModel(model, rUrl, requireCaptcha: model.ShowCaptcha));
            try
            {
                var loginCommand = new LoginCommand()
                {
                    UserName = model.UserName,
                    Password = model.Password,
                    CaptchaKey = model.CaptchaKey,
                    CaptchaCode = model.CaptchaCode,
                    RequireCaptcha = model.ShowCaptcha,
                };
                var result2 = await Mediator.Send(loginCommand);

                if (result2.IsSuccess && result2.TwoFactorEnabled)
                    return RedirectToAction(nameof(LoginWith2fa), new { rememberMe = true, returnUrl = rUrl });

                // Healan: all roles (including Admin) must complete OIDC ReturnUrl back to clinic.
                // Do NOT divert Admin to /AdminPanel — that breaks clinic login for AdminUser.
                if (result2.IsSuccess && !result2.TwoFactorEnabled)
                    return await RedirectAfterLoginAsync(result2.userId, rUrl);
            }
            catch (Exception ex)
            {
                model.ReturnUrl = rUrl;
                if (ModelState["ReturnUrl"] != null)
                    ModelState["ReturnUrl"].RawValue = model.ReturnUrl;
                ModelState.AddModelError(string.Empty, ex.Message);
                // Failed login → show captcha on next attempt
                return View(await FillModel(model, rUrl, requireCaptcha: true));
            }

            // Unsuccessful credential check → require captcha next
            ModelState.AddModelError(string.Empty, "نام کاربری یا رمز عبور صحیح نیست");
            return View(await FillModel(model, rUrl, requireCaptcha: true));
        }

        [HttpGet]
        [AllowAnonymous]
        public IActionResult SuccessLogin(string ReturnUrl = null)
        {
            // Never show the static Success page — always continue to clinic / OIDC returnUrl.
            if (!string.IsNullOrWhiteSpace(ReturnUrl))
            {
                if (_interaction.IsValidReturnUrl(ReturnUrl) || Url.IsLocalUrl(ReturnUrl))
                    return Redirect(ReturnUrl);
            }

            return Redirect(GetClinicRedirectUrl());
        }
        private async Task<LoginViewModel> FillModel(LoginViewModel model, string returnUrl, bool requireCaptcha = false)
        {
            try
            {
                model.ReturnUrl = returnUrl;
                if (ModelState["ReturnUrl"] != null)
                    ModelState["ReturnUrl"].RawValue = model.ReturnUrl;

                model.ShowCaptcha = requireCaptcha;
                if (!requireCaptcha)
                {
                    model.Image = null;
                    model.CaptchaKey = null;
                    model.CaptchaCode = null;
                    return model;
                }

                var getCaptcha = await _captchaProviderService.GetCaptcha();
                model.Image = getCaptcha.Image;
                model.CaptchaKey = getCaptcha.CaptchaKey.ToString();
                model.CaptchaCode = string.Empty;
                if (ModelState["CaptchaKey"] != null)
                {
                    ModelState["CaptchaKey"].RawValue = model.CaptchaKey;
                    ModelState["CaptchaCode"].RawValue = model.CaptchaCode;
                }

                if (model.Image == null || model.Image.Length == 0)
                    ModelState.AddModelError(string.Empty, "سرویس کپچا در دسترس نیست. لطفاً بعداً دوباره تلاش کنید.");

                return model;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Captcha service unavailable while refreshing login model");
                model.ShowCaptcha = true;
                ModelState.AddModelError(string.Empty, "سرویس کپچا در دسترس نیست. لطفاً بعداً دوباره تلاش کنید.");
                return model;
            }
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> LoginWith2fa(bool rememberMe, string returnUrl = null)
        {

            var model = new LoginWith2faViewModel { RememberMe = rememberMe, ReturnUrl = returnUrl };

            return View(model);
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> LoginWith2fa(LoginWith2faViewModel model, bool rememberMe, string returnUrl = null)
        {

            try
            {
                var login2faCommand = new Login2FACommand() { Code = model.TwoFactorCode };
                var result = await Mediator.Send(login2faCommand);


                //_cacheManager.Remove(result.userId.ToString());


                // Healan: never divert Admin to AdminPanel during OIDC / clinic login.
                if (result.IsSuccess)
                    return await RedirectAfterLoginAsync(result.userId, returnUrl ?? model.ReturnUrl);
                //return Redirect(returnUrl);
            }
            catch (Exception ex)
            {
                ModelState["ReturnUrl"].RawValue = model.ReturnUrl;
                ModelState.AddModelError(string.Empty, ex.Message);
            }

            //return RedirectToAction("LoginWith2fa");
            return View(nameof(LoginWith2fa), new LoginWith2faViewModel { RememberMe = rememberMe, ReturnUrl = returnUrl });
        }



        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> Logout(string logoutId)
        {

            //var context = await _interaction.GetLogoutContextAsync(logoutId);
            //bool showSignoutPrompt = true;

            Guid result = Guid.Empty;
            string url = string.Empty;


            if (Guid.TryParse(HttpContext?.User?.FindFirstValue("sub"), out result))
            {
                AddInToBlackList();
                url = GetCashedValue(result.ToString());
            }


            await _signInManager.SignOutAsync();
            //await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);
            await HttpContext.SignOutAsync();
            await _signInManager.SignOutAsync();
            if (!string.IsNullOrEmpty(url))
                return Redirect(url);


            return Redirect(_configuration["IdentityServer:BaseUrl"]);


            // no external signout supported for now (see \Quickstart\Account\AccountController.cs TriggerExternalSignout)
            //return Ok(new
            //{
            //    showSignoutPrompt,
            //    ClientName = string.IsNullOrEmpty(context?.ClientName) ? context?.ClientId : context?.ClientName,
            //    context?.PostLogoutRedirectUri,
            //    context?.SignOutIFrameUrl,
            //    logoutId
            //});
        }


        private void AddInToBlackList()
        {
            var auth_time = HttpContext?.User?.FindFirstValue("auth_time");
            Guid result = Guid.Empty;
            if (Guid.TryParse(HttpContext?.User?.FindFirstValue("sub"), out result))
            {
                _cacheManager.AddString(result.ToString() + "_" + auth_time, DateTime.Now.ToShortDateString(), TimeSpan.FromHours(12));
            }
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Logout(LogoutInputModel model)
        {
            var vm = await _account.BuildLoggedOutViewModelAsync(model.LogoutId);
            await _signInManager.SignOutAsync();
            //await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);
            await HttpContext.SignOutAsync();
            await _signInManager.SignOutAsync();
            _logger.LogInformation("User logged out.");

            // check if we need to trigger sign-out at an upstream identity provider
            if (vm.TriggerExternalSignout)
            {
                // build a return URL so the upstream provider will redirect back
                // to us after the user has logged out. this allows us to then
                // complete our single sign-out processing.
                string url = Url.Action("Logout", new { logoutId = vm.LogoutId });

                // this triggers a redirect to the external provider for sign-out
                // hack: try/catch to handle social providers that throw
                return SignOut(new AuthenticationProperties { RedirectUri = url }, vm.ExternalAuthenticationScheme);
                //return Redirect("http://localhost:4200");
            }

            return View("LoggedOut", vm);
        }



        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword(string returnUrl = null)
        {
            var model = new ForgotPasswordViewModel { ReturnUrl = returnUrl };
            await AttachCaptchaAsync(model);
            return View(model);
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordViewModel model)
        {
            if (!ModelState.IsValid)
            {
                await AttachCaptchaAsync(model);
                return View(model);
            }

            try
            {
                var forgetPasswordCommand = new ForgetPasswordCommand()
                {
                    UserName = model.PhoneNumber,
                    CaptchaCode = model.CaptchaCode,
                    CaptchaKey = model.CaptchaKey,
                };
                await Mediator.Send(forgetPasswordCommand);
                TempData["PhoneNumber"] = model.PhoneNumber;
                return RedirectToAction(nameof(ResetPassword), new { returnUrl = model.ReturnUrl });
            }
            catch (Exception ex)
            {
                ModelState.AddModelError(string.Empty, ex.Message);
                await AttachCaptchaAsync(model);
                return View(model);
            }
        }

        [HttpGet]
        [AllowAnonymous]
        public IActionResult ForgotPasswordConfirmation()
        {
            return View();
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword(string returnUrl = null)
        {
            var model = new ResetPasswordViewModel { ReturnUrl = returnUrl };
            if (TempData["PhoneNumber"] != null)
                model.PhoneNumber = TempData["PhoneNumber"].ToString();
            TempData["PhoneNumber"] = model.PhoneNumber;
            await AttachCaptchaAsync(model);
            return View(model);
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword(ResetPasswordViewModel model)
        {
            TempData["PhoneNumber"] = model.PhoneNumber;
            if (!ModelState.IsValid)
            {
                await AttachCaptchaAsync(model);
                return View(model);
            }

            try
            {
                var command = new ResetPasswordCommand()
                {
                    Code = model.Code,
                    UserName = model.PhoneNumber,
                    Password = model.Password,
                    CaptchaKey = model.CaptchaKey,
                    CaptchaCode = model.CaptchaCode,
                };
                await Mediator.Send(command);
                return RedirectToAction(nameof(Login), new { returnUrl = model.ReturnUrl });
            }
            catch (Exception ex)
            {
                ModelState.AddModelError(string.Empty, ex.Message);
                await AttachCaptchaAsync(model);
                return View(model);
            }
        }

        private async Task AttachCaptchaAsync(ForgotPasswordViewModel model)
        {
            try
            {
                var getCaptcha = await _captchaProviderService.GetCaptcha();
                model.Image = getCaptcha?.Image;
                model.CaptchaKey = getCaptcha?.CaptchaKey.ToString();
                model.CaptchaCode = string.Empty;
                if (ModelState["CaptchaKey"] != null)
                    ModelState["CaptchaKey"].RawValue = model.CaptchaKey;
                if (ModelState["CaptchaCode"] != null)
                    ModelState["CaptchaCode"].RawValue = model.CaptchaCode;

                if (model.Image == null || model.Image.Length == 0)
                    ModelState.AddModelError(string.Empty, "سرویس کپچا در دسترس نیست. لطفاً چند لحظه بعد دوباره تلاش کنید.");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Captcha unavailable for ForgotPassword");
                model.Image = null;
                ModelState.AddModelError(string.Empty, "سرویس کپچا در دسترس نیست. لطفاً چند لحظه بعد دوباره تلاش کنید.");
            }
        }

        private async Task AttachCaptchaAsync(ResetPasswordViewModel model)
        {
            try
            {
                var getCaptcha = await _captchaProviderService.GetCaptcha();
                model.Image = getCaptcha?.Image;
                model.CaptchaKey = getCaptcha?.CaptchaKey.ToString();
                model.CaptchaCode = string.Empty;
                if (ModelState["CaptchaKey"] != null)
                    ModelState["CaptchaKey"].RawValue = model.CaptchaKey;
                if (ModelState["CaptchaCode"] != null)
                    ModelState["CaptchaCode"].RawValue = model.CaptchaCode;

                if (model.Image == null || model.Image.Length == 0)
                    ModelState.AddModelError(string.Empty, "سرویس کپچا در دسترس نیست. لطفاً چند لحظه بعد دوباره تلاش کنید.");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Captcha unavailable for ResetPassword");
                model.Image = null;
                ModelState.AddModelError(string.Empty, "سرویس کپچا در دسترس نیست. لطفاً چند لحظه بعد دوباره تلاش کنید.");
            }
        }


        #region Helpers

        private void AddErrors(IdentityResult result)
        {
            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }
        }

        private IActionResult RedirectToLocal(string returnUrl)
        {
            if (Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }
            else
            {
                return RedirectToAction(nameof(HomeController.Index), "Home");
            }
        }

        private void ValidateReturnUrl(string returnUrl)
        {
#if DEBUG
            return;
#endif
            if (bool.Parse(_configuration["IsDevMode"]))
                return;
            if (!string.IsNullOrEmpty(returnUrl))
            {
                _logger.LogInformation("returnUrl :   " + returnUrl);
                _logger.LogInformation("HttpContext.Request.Host.Host :   " + HttpContext.Request.Host.Host);
                Uri myUri = new Uri(returnUrl);
                string host = myUri.Host;

                if (host.Contains("."))
                {
                    var subHost = GetSubdomain(host);
                    host = host.Replace(subHost, "");
                }

                var requestHost = HttpContext.Request.Host.Host;
                if (requestHost.Contains("."))
                {
                    var subRequestHost = GetSubdomain(requestHost);
                    requestHost = requestHost.Replace(subRequestHost, "");
                }

                _logger.LogInformation("subHost :   " + host);
                _logger.LogInformation("requestHost   " + requestHost);

#if !DEBUG
                if (requestHost.Trim().ToLower() != host.Trim().ToLower())
                {
                    ModelState.AddModelError("returnUrl", "آدرس برگشتی ورود به سامانه صحیح نیست");
                }
#endif
            }
        }
        private string GetSubdomain(string url, string domain = null)
        {
            var subdomain = url;
            if (subdomain != null)
            {
                if (domain == null)
                {
                    // Since we were not provided with a known domain, assume that second-to-last period divides the subdomain from the domain.
                    var nodes = url.Split('.');
                    var lastNodeIndex = nodes.Length - 1;
                    if (lastNodeIndex > 0)
                        domain = nodes[lastNodeIndex - 1] + "." + nodes[lastNodeIndex];
                }

                // Verify that what we think is the domain is truly the ending of the hostname... otherwise we're hooped.
                if (!subdomain.EndsWith(domain))
                    throw new ArgumentException("Site was not loaded from the expected domain");

                // Quash the domain portion, which should leave us with the subdomain and a trailing dot IF there is a subdomain.
                subdomain = subdomain.Replace(domain, "");
                // Check if we have anything left.  If we don't, there was no subdomain, the request was directly to the root domain:
                if (string.IsNullOrWhiteSpace(subdomain))
                    return null;

                // Quash any trailing periods
                subdomain = subdomain.TrimEnd(new[] { '.' });
            }

            return subdomain;
        }
        #endregion


        #region Role

        [HttpGet]
        [Authorize(Roles = ConstUserInfo.AdminRole)]
        public ActionResult AddRole()
        {
            if (TempData["Message"] != null && TempData["AlertMessage"] != null)
            {
                ViewBag.Message = TempData["Message"].ToString();
                ViewBag.AlertMessage = TempData["AlertMessage"].ToString();
            }

            return View(new AddRole());
        }

        [HttpPost]
        [Authorize(Roles = ConstUserInfo.AdminRole)]
        public async Task<IActionResult> AddRole(AddRole model)
        {
            if (ModelState.IsValid)
            {
                var isExistAdminRole = await _roleManager.RoleExistsAsync(model.Title);
                if (isExistAdminRole == false)
                {
                    var role = new ApplicationRole(model.Title);
                    var getRoleManager = await _roleManager.CreateAsync(role);
                    if (getRoleManager.Succeeded)
                    {
                        ViewBag.AlertMessage = ConstMessage.AlertSuccess;
                        ViewBag.Message = "نقش باموفقیت در سامانه اضافه شد";
                        return View(model);
                    }
                    else
                    {
                        ViewBag.AlertMessage = ConstMessage.AlertState;
                        ViewBag.Message = "مشکلی در سامانه به وجود امده لطفا دوباره تلاش کنید";
                        return View(model);
                    }
                }
                else
                {
                    ViewBag.AlertMessage = ConstMessage.AlertState;
                    ViewBag.Message = "این نقش در سامانه موجود می باشد";
                    return View(model);
                }
            }

            ViewBag.AlertMessage = ConstMessage.AlertState;
            ViewBag.Message = ConstMessage.MustBeFull;
            return View(model);
        }

        [HttpGet]
        [Authorize(Roles = ConstUserInfo.AdminRole)]
        public async Task<IActionResult> ListRole()
        {
            var roles = await _roleManager.Roles.ToListAsync();
            return View(model: roles);
        }


        #endregion Role

        #region User

        [HttpGet]
        [Authorize(Roles = ConstUserInfo.AdminRole)]
        public ActionResult AddUser()
        {
            if (TempData["Message"] != null && TempData["AlertMessage"] != null)
            {
                ViewBag.Message = TempData["Message"].ToString();
                ViewBag.AlertMessage = TempData["AlertMessage"].ToString();
            }

            ViewBag.ItemRole = _roleManager.Roles.Select(item => new SelectListItem(item.DisplayName, item.Name.ToString()));
            return View(new AddUser());
        }

        [HttpPost]
        [Authorize(Roles = ConstUserInfo.AdminRole)]
        public async Task<IActionResult> AddUser(AddUser model)
        {
            if (ModelState.IsValid)
            {
                ViewBag.ItemRole = _roleManager.Roles.Select(item => new SelectListItem(item.DisplayName, item.Name.ToString()));
                var isExistAdminUser = await _userManager.Users.FirstOrDefaultAsync(x => x.UserName == model.UserName);
                if (isExistAdminUser != null)
                {
                    ViewBag.AlertMessage = ConstMessage.AlertState;
                    ViewBag.Message = "این نام کاربری در سیستم موجود می باشد";
                    return View(model);
                }

                var user = new ApplicationUser { UserName = model.UserName, FirstName = model.FirstName, LastName = model.LastName, EmailConfirmed = true, DepartmentId = model.DepartmentId, IsActive = true, PhoneNumberConfirmed = true, PhoneNumber = model.UserName };
                var result = await _userManager.CreateAsync(user, model.Password);
                if (result.Succeeded)
                {
                    var identityResultAddToRole = await _userManager.AddToRolesAsync(user, model.RoleId);
                    if (identityResultAddToRole.Succeeded)
                    {
                        ViewBag.AlertMessage = ConstMessage.AlertSuccess;
                        ViewBag.Message = "کاربر باموفقیت در سامانه اضافه شد";
                        return View(model);
                    }
                }

                ViewBag.AlertMessage = ConstMessage.AlertState;
                ViewBag.Message = "لطفا دوباره تلاش کنید";
                return View(model);
            }

            ViewBag.AlertMessage = ConstMessage.AlertState;
            ViewBag.Message = "لطفا اطلاعات را صحیح وارد نمایید";
            return View(model);
        }

        [HttpGet]
        [Authorize(Roles = ConstUserInfo.AdminRole)]
        public async Task<IActionResult> ListUser()
        {
            var users = await _userManager.Users.ToListAsync();
            return View(model: users);
        }

        #endregion User
    }
    public static class Extensions
    {
        /// <summary>
        /// Checks if the redirect URI is for a native client.
        /// </summary>
        /// <returns></returns>
        public static bool IsNativeClient(this AuthorizationRequest context)
        {
            return !context.RedirectUri.StartsWith("https", StringComparison.Ordinal)
               && !context.RedirectUri.StartsWith("http", StringComparison.Ordinal);
        }

        public static IActionResult LoadingPage(this Controller controller, string viewName, string redirectUri)
        {
            controller.HttpContext.Response.StatusCode = 200;
            controller.HttpContext.Response.Headers["Location"] = "";

            return controller.View(viewName, new RedirectViewModel { RedirectUrl = redirectUri });
        }
    }
    public class RedirectViewModel
    {
        public string RedirectUrl { get; set; }
    }
}
