using IdentityServer.Application.ContextMaps.Users.ForgetPasswords.Query;
using IdentityServer.Application.ContextMaps.Users.Login.Query;
using IdentityServer.Domain.Data;
using IdentityServer.Domain.Entities;
using IdentityServer4;
using MediatR;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
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
    public class ResetPasswordCommand : IRequest<ResetPasswordResponse>
    {
        public string UserName { get; set; }
        public string Code { get; set; }
        public string Password { get; set; }
        public string CaptchaKey { get; set; }
        public string CaptchaCode { get; set; }
    }
    public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, ResetPasswordResponse>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ApplicationDbContext _applicationDbContext;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ICaptchaProviderService _captchaValidatorService;
        private readonly ISmsApiService _smsService;
        private readonly ISecurityService _securityService;
        public ResetPasswordCommandHandler(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, ApplicationDbContext applicationDbContext, IHttpContextAccessor httpContextAccessor, ICaptchaProviderService captchaValidatorService, ISmsApiService smsService, ISecurityService securityService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _applicationDbContext = applicationDbContext;
            _httpContextAccessor = httpContextAccessor;
            _captchaValidatorService = captchaValidatorService;
            _smsService = smsService;
            _securityService = securityService;
        }
        public async Task<ResetPasswordResponse> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
        {

            var captchaResult = await _captchaValidatorService.ValidateCaptcha(new CaptchaModelRequest(request.CaptchaKey, request.CaptchaCode));
            if (captchaResult == null || !captchaResult.Result)
            {
                throw new BadRequestExceptions("کد کپچا صحیح نیست");
            }

            var getUser = _applicationDbContext.Users.FirstOrDefault(x => x.UserName == request.UserName);
            if (getUser == null)
            {
                throw new BadRequestExceptions("کد وارد شده صحیح نیست");
            }
            if (!getUser.IsActive)
            {
                throw new BadRequestExceptions("نام کاربری یا رمز عبور صحیح نیست");
            }

            if (!getUser.CodeSendedDateTime.HasValue)
                throw new BadRequestExceptions("کد اعتبار سنجی ارسال نشده است");
            if (DateTimeHelper.GetCurrentDateTime().Subtract(getUser.CodeSendedDateTime.Value).TotalSeconds > 120)
                throw new BadRequestExceptions("کد وارد شده منقضی شده است");


            var validator = new PasswordValidator<ApplicationUser>();
            var passResult = await validator.ValidateAsync(_userManager, null, request.Password);

            if (!passResult.Succeeded)
            {
                throw new BadRequestExceptions("طول پسورد باید حداقل 8 کاراکتر و به صورت لاتین باشد و شامل حرف کوچک، حرف بزرگ، عدد و کاراکتر پیچیده مثل ? یا ! باشد ");
            }
            getUser.CodeSendedDateTime = null;

            var token = _securityService.Decrypt(request.Code, getUser.ResetPasswordToken);
            var result = await _userManager.ResetPasswordAsync(getUser, token, request.Password);
            if (result.Succeeded)
            {
                getUser.ResetPasswordToken = null;
                getUser.CodeSendedDateTime = null;
                // Forgot-password SMS must not block the next login (2FA) OTP.
                _smsService.ClearSmsRateLimit(getUser.PhoneNumber);
                await _applicationDbContext.SaveChangesAsync(cancellationToken);
                return new ResetPasswordResponse() { userId = getUser.Id.ToString() };
            }
            else
            {
                throw new BadRequestExceptions("خطا در تغییر رمز عبور");
            }




        }
    }






}
