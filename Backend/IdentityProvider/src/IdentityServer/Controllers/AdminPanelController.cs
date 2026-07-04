using IdentityServer.ApplicationPolicy.Services;
using IdentityServer.Domain.Data;
using IdentityServer.Domain.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace IdentityServer.Controllers
{
    [Authorize(Roles = ConstUserInfo.AdminRole)]
    //[ApiExplorerSettings(IgnoreApi = true)]
    public class AdminPanelController : Controller
    {
       // private readonly IUserAccessActionService _userAccessAction;
        public AdminPanelController()
        {
         //   _userAccessAction = userAccessAction;
        }
        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public IActionResult ListRole()
        {
            return View();
        }
        //[HttpPost]
        //public async Task<IActionResult> UpdateAccess()
        //{
        //    await _userAccessAction.UpdateUserAccessSummary();
        //    return View();
        //}
        //[HttpGet]
        //public async Task<IActionResult> GetAccess([FromQuery] Guid roleId, [FromQuery] Guid groupRoleId)
        //{
        //   var result= await _userAccessAction.GetUserAccessSummary(roleId,groupRoleId);
        //    return View();
        //}
        //[HttpPost]
        //public async Task<IActionResult> SetAccess([FromBody] SetAccessViewModel setAccessViewModel)
        //{
        //    var result = await _userAccessAction.SetAccess(setAccessViewModel);
        //    return View();
        //}
    }
}
