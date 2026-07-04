using CaptchaProvider.Domain.DTOs;
using CaptchaProvider.Domain.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;

namespace CaptchaProvider.WebUI.Controllers
{
    [ApiController]
    [AllowAnonymous]
    [Route("CaptchaProvider/api/v1/[controller]")]
    public class CaptchaController : ControllerBase
    {
        private readonly ICaptchaService _captchaService;
        public CaptchaController(ICaptchaService captchaService)
        {
            _captchaService = captchaService;
        }
        [HttpGet("Get")]
        public async Task<IActionResult> Get()
        {
            var result=await _captchaService.GetCaptchaInfoResult();
            return Ok(result);
        }

        [HttpPost("Validate")]
        public async Task<IActionResult> Validate([FromBody] ValidationCaptchaRequest request)
        {
            var result = await _captchaService.ValidateCaptcha(request);
            return Ok(result);
        }
    }
}
