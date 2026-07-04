using Healan.Application.Users.Commands.SaveUser;
using Healan.Application.Users.Queries.CurrentUser;
using Healan.Application.Users.Queries.GetUserInfo;
using Healan.Application.Users.Queries.GetUsers;
using Microsoft.AspNetCore.Mvc;
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
    public async Task<IActionResult> Register([FromBody] UserSaveCommand request)
    {
        if (request == null) return BadRequest();
        return Ok(await Mediator.Send(request));
    }

    /// <summary>
    /// لیست کاربرها
    /// </summary>
    /// <param name="userRequest"></param>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> UserList([FromQuery] UserListQuery userRequest)=>    
         Ok(await Mediator.Send(userRequest));
   

    /// <summary>
    /// جزئیات کاربر
    /// </summary>
    /// <param name="userId"></param>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> UserInfo([FromQuery] int userId)=>   
         Ok(await Mediator.Send(new GetUserInfoQuery() { UserId = userId }));


    [ProducesResponseType((int)HttpStatusCode.OK)]
    [HttpGet("CurrentUser/{lang}")]
    public async Task<IActionResult> CurrentUser()
    {
        return Ok(await Mediator.Send(new CurrentUserQuery()));
    }

 

}
