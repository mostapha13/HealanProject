using IdentityServer.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Share.Application.Common.Interfaces;
using Share.Domain.Exceptions;
using System.ComponentModel.DataAnnotations;

namespace IdentityServer.UserManagerAPI.Controllers;

/// <summary>حساب کاربری جاری (پروفایل / رمز عبور)</summary>
public class AccountController : ApiControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ICurrentUserService _currentUserService;

    public AccountController(UserManager<ApplicationUser> userManager, ICurrentUserService currentUserService)
    {
        _userManager = userManager;
        _currentUserService = currentUserService;
    }

    public class ChangePasswordRequest
    {
        [Required]
        public string OldPassword { get; set; } = string.Empty;
        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;
        [Required]
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class UpdateProfileRequest
    {
        [Required]
        public string FirstName { get; set; } = string.Empty;
        [Required]
        public string LastName { get; set; } = string.Empty;
        [Required]
        public string PhoneNumber { get; set; } = string.Empty;
    }

    [HttpPost("ChangePassword")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (request.NewPassword != request.ConfirmPassword)
            throw new BadRequestExceptions("رمز جدید و تکرار آن یکسان نیست.");

        var user = await GetCurrentUserAsync();
        var result = await _userManager.ChangePasswordAsync(user, request.OldPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            var msg = string.Join(" ", result.Errors.Select(e => e.Description));
            throw new BadRequestExceptions(string.IsNullOrWhiteSpace(msg) ? "تغییر رمز ناموفق بود." : msg);
        }

        return Ok(new { success = true, message = "رمز عبور با موفقیت تغییر کرد." });
    }

    [HttpPost("UpdateProfile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var user = await GetCurrentUserAsync();
        var phone = request.PhoneNumber.Trim();
        if (string.IsNullOrWhiteSpace(phone))
            throw new BadRequestExceptions("شماره موبایل الزامی است.");

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.PhoneNumber = phone;
        user.UserName = phone;
        user.NormalizedUserName = _userManager.NormalizeName(phone);
        user.PhoneNumberConfirmed = true;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            var msg = string.Join(" ", result.Errors.Select(e => e.Description));
            throw new BadRequestExceptions(string.IsNullOrWhiteSpace(msg) ? "به‌روزرسانی پروفایل ناموفق بود." : msg);
        }

        return Ok(new
        {
            success = true,
            firstName = user.FirstName,
            lastName = user.LastName,
            phoneNumber = user.PhoneNumber,
            message = "اطلاعات پروفایل ذخیره شد.",
        });
    }

    private async Task<ApplicationUser> GetCurrentUserAsync()
    {
        var userId = _currentUserService.UserId;
        if (userId == Guid.Empty)
            throw new UnauthorizedAccessException("کاربر احراز هویت نشده است.");

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            throw new NotFoundExceptions("کاربر یافت نشد.");
        return user;
    }
}
