using Healan.Application.Users.Commands.SaveUser;
using Healan.Application.Users.Commands.UpdateMyProfile;
using Healan.Application.Users.Queries.CurrentUser;
using Healan.Application.Users.Queries.GetUserInfo;
using Healan.Application.Users.Queries.GetUsers;
using Microsoft.AspNetCore.Mvc;
using Share.Domain.Constants;
using Share.Infrastructure.CustomAttributes;
using System.Net;

namespace Healan.WebApi.Controllers;
/// <summary>
/// کاربران
/// </summary>
public class UserController : ApiControllerBase
{
    /// <summary>
    /// ثبت کاربر
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPost("[action]")]
    [AccessForm(HealanAccessFormIds.UserDefine)]
    public Task<IActionResult> Register([FromBody] UserSaveCommand request) =>
        SendCommand(request);

    /// <summary>
    /// لیست کاربرها
    /// </summary>
    /// <param name="userRequest"></param>
    /// <returns></returns>
    [HttpGet("[action]")]
    [AccessForm(HealanAccessFormIds.UserDefine)]
    public async Task<IActionResult> UserList([FromQuery] UserListQuery userRequest)=>    
         Ok(await Mediator.Send(userRequest));
   

    /// <summary>
    /// جزئیات کاربر
    /// </summary>
    /// <param name="userId"></param>
    /// <returns></returns>
    [HttpGet("[action]")]
    [AccessForm(HealanAccessFormIds.UserDefine)]
    public async Task<IActionResult> UserInfo([FromQuery] int userId)=>   
         Ok(await Mediator.Send(new GetUserInfoQuery() { UserId = userId }));


    [ProducesResponseType((int)HttpStatusCode.OK)]
    [HttpGet("CurrentUser/{lang}")]
    public async Task<IActionResult> CurrentUser()
    {
        return Ok(await Mediator.Send(new CurrentUserQuery()));
    }

    /// <summary>به‌روزرسانی پروفایل کاربر جاری (بدون نیاز به دسترسی تعریف کاربر)</summary>
    [HttpPost("UpdateMyProfile")]
    public Task<IActionResult> UpdateMyProfile([FromBody] UpdateMyProfileCommand request) =>
        SendCommand(request);
}
