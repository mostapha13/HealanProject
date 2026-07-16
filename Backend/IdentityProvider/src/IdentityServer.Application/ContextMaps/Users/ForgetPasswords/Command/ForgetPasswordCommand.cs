using IdentityServer.Application.ContextMaps.Users.ForgetPasswords.Query;
using IdentityServer.Application.ContextMaps.Users.Login.Query;
using IdentityServer.Domain.Data;
using IdentityServer.Domain.Entities;
using IdentityServer4;
using MediatR;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Share.Application.Common.Interfaces;
using Share.Domain.Enums;
using Share.Domain.Exceptions;
using Share.Domain.Extensions;
using Share.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace IdentityServer.Application.ContextMaps.Users.ForgetPasswords.Command
{
    public class ForgetPasswordCommand : IRequest<ForgetPasswordResponse>
    {
        public string UserName { get; set; }
        public string CaptchaKey { get; set; }
        public string CaptchaCode { get; set; }
    }
    public class ForgetPasswordCommandHandler : IRequestHandler<ForgetPasswordCommand, ForgetPasswordResponse>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ApplicationDbContext _applicationDbContext;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ICaptchaProviderService _captchaValidatorService;
        private readonly ISmsApiService _smsService;
        private readonly ISecurityService _securityService;
        public ForgetPasswordCommandHandler(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, ApplicationDbContext applicationDbContext, IHttpContextAccessor httpContextAccessor, ICaptchaProviderService captchaValidatorService, ISmsApiService smsService, ISecurityService securityService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _applicationDbContext = applicationDbContext;
            _httpContextAccessor = httpContextAccessor;
            _captchaValidatorService = captchaValidatorService;
            _smsService = smsService;
            _securityService = securityService;
        }
        public async Task<ForgetPasswordResponse> Handle(ForgetPasswordCommand request, CancellationToken cancellationToken)
        {
            await _signInManager.SignOutAsync();

#if !DEBUG
            var captchaResult=await _captchaValidatorService.ValidateCaptcha(new CaptchaModelRequest(request.CaptchaKey,request.CaptchaCode));
            if(captchaResult==null || !captchaResult.Result)
            {
                throw new BadRequestExceptions("کد کپچا صحیح نیست");
            }
#endif

            var getUser = _applicationDbContext.Users.FirstOrDefault(x => x.UserName == request.UserName);
            if (getUser == null)
            {
                return new ForgetPasswordResponse() { userId = Guid.NewGuid().ToString() };
                //throw new BadRequestExceptions("نام کاربری یا رمز عبور صحیح نیست");
            }
            if (!getUser.IsActive)
            {
                throw new BadRequestExceptions("نام کاربری یا رمز عبور صحیح نیست");
            }

            _smsService.ValidToSendSms(getUser.PhoneNumber);

            var token = await _userManager.GeneratePasswordResetTokenAsync(getUser);
            var code = await _userManager.GenerateTwoFactorTokenAsync(getUser, "CustomEmail");
            getUser.ResetPasswordToken = _securityService.Encrypt(code,token);
            getUser.CodeSendedDateTime = DateTimeHelper.GetCurrentDateTime();
            await _applicationDbContext.SaveChangesAsync();


            if (string.IsNullOrWhiteSpace(code))
            {
                throw new BadRequestExceptions("Reset Code Not Generated");
            }

            var smsResult = await _smsService.SendSMS(new SMSModelRequest()
            {
                PhoneNumbers = new List<string>() { getUser.PhoneNumber },
                Message = $"کلینیک قلب دکتر معصومه شهرویی\nکد بازیابی رمز عبور: {code}",
            });

            if (smsResult != null && !string.IsNullOrWhiteSpace(smsResult.ErrorMessage))
                throw new BadRequestExceptions($"ارسال پیامک ناموفق بود: {smsResult.ErrorMessage}");

            return new ForgetPasswordResponse() { userId = getUser.Id.ToString() };
        }
    }





}
