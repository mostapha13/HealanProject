using CaptchaProvider.Domain.Configs;
using CaptchaProvider.Domain.DTOs;
using CaptchaProvider.Domain.Entities;
using CaptchaProvider.Domain.Enums;
using CaptchaProvider.Domain.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Share.Application.Common.Interfaces;
using SixLabors.ImageSharp;
using SixLaborsCaptcha.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using SixLabors.Fonts;
using System.IO;
using System.Globalization;
using CaptchaGen.NetCore;
using Share.Domain.Exceptions;
using Share.Domain.Extensions;

namespace CaptchaProvider.Infrastructure.Services
{
    public class CaptchaService : ICaptchaService
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IDateTime _dateTime;
        private readonly IOptionsMonitor<CaptchaConfig> _captchaConfig;
        public CaptchaService(IApplicationDbContext applicationDbContext, IHttpContextAccessor httpContextAccessor, IDateTime dateTime, IOptionsMonitor<CaptchaConfig> captchaConfig)
        {
            _applicationDbContext = applicationDbContext;
            _httpContextAccessor = httpContextAccessor;
            _dateTime = dateTime;
            _captchaConfig = captchaConfig;
        }
        public async Task<CaptchaInfoResult> GetCaptchaInfoResult()
        {
            CaptchaInfo captchaInfo = new CaptchaInfo();

            //int random = new Random().Next(0, 3);


            var result = GetCode(true);
            captchaInfo.Code = result.code;
            captchaInfo.Result = result.result;
            captchaInfo.RequestIp = _httpContextAccessor.HttpContext.Connection.RemoteIpAddress.ToString();
            captchaInfo.RequestTime = _dateTime.Now;
            _applicationDbContext.CaptchaInfos.Add(captchaInfo);
            await _applicationDbContext.SaveChangesAsync(System.Threading.CancellationToken.None);
            var captchaInfoResult = GetCaptchaInfoResult(captchaInfo.Code, captchaInfo.CaptchaInfoId.ToString(), true);
            return captchaInfoResult;
        }
        public async Task<bool> ValidateCaptcha(ValidationCaptchaRequest validationCaptchaRequest)
        {
            if (validationCaptchaRequest == null)
                throw new BadRequestExceptions();
            var captchaId = validationCaptchaRequest.CaptchaKey.ToGuid();
            if (!captchaId.HasValue)
                return false;

            var captchaInfo = await _applicationDbContext.CaptchaInfos.FirstOrDefaultAsync(p => p.CaptchaInfoId == captchaId);
            if (captchaInfo == null)
                return false;
            if (DateTime.Now.Subtract(captchaInfo.RequestTime).TotalSeconds > _captchaConfig.CurrentValue.ValidityDuration)
            {
                await RemoveCaptchaInfo(captchaInfo);
                return false;
            }
            if (captchaInfo.Result.ToString().ToLower() != validationCaptchaRequest.CaptchaCode.Trim().ToLower())
            {
                await RemoveCaptchaInfo(captchaInfo);
                return false;
            }
            await RemoveCaptchaInfo(captchaInfo);
            return true;
        }
        public async Task RemoveCaptchaInfo(CaptchaInfo captchaInfo)
        {
            _applicationDbContext.CaptchaInfos.Remove(captchaInfo);
            await _applicationDbContext.SaveChangesAsync(System.Threading.CancellationToken.None);
        }
        private CaptchaInfoResult GetCaptchaInfoResult(string code, string captchaInfoId, bool isLetter)
        {
            CaptchaInfoResult captchaInfoResult = new CaptchaInfoResult();
            captchaInfoResult.CaptchaKey = captchaInfoId;
            ushort noiseRate = 300;
            byte maxRotationDegrees = 10;
            byte drawLines = 1;
            switch (_captchaConfig.CurrentValue.CaptchaNoise)
            {
                case Domain.Enums.CaptchaNoise.Low:
                    noiseRate = 300;
                    maxRotationDegrees = 8;
                    drawLines = 2;
                    break;
                case Domain.Enums.CaptchaNoise.Medium:
                    noiseRate = 1100;
                    maxRotationDegrees = 18;
                    drawLines = 3;
                    break;
                case Domain.Enums.CaptchaNoise.High:
                    noiseRate = 2000;
                    maxRotationDegrees = 24;
                    drawLines = 5;
                    break;
            }
            if (code.Contains("+") || code.Contains("x") || code.Contains("-"))
            {
                noiseRate = (ushort)(noiseRate / 2);
                maxRotationDegrees = (byte)(maxRotationDegrees / 2);
            }



            var slc = new SixLaborsCaptchaModule(new SixLaborsCaptchaOptions
            {
                DrawLines = drawLines,
                MaxRotationDegrees = maxRotationDegrees,
                NoiseRate = noiseRate,
                TextColor = new Color[] { Color.Blue, Color.Black },
            });
            var key = code;
           
            if (isLetter)
                using (MemoryStream picStream = ImageFactory.BuildImage(key, 50, 220, 20, 4))
                {
                    captchaInfoResult.Image = picStream.ToArray();
                }
            else
                captchaInfoResult.Image = slc.Generate(key);
            return captchaInfoResult;
        }
        private (string code, string result) GetCode(bool isLetter)
        {
            CaptchaFormat captchaFormat = _captchaConfig.CurrentValue.CaptchaFormat;
            if (captchaFormat == CaptchaFormat.Hybrid)
            {
                var random = new Random().Next(6, 10)/2;
                captchaFormat = (CaptchaFormat)random;
            }
            return GenerateCode(captchaFormat, isLetter);
        }
        private (string code, string result) GenerateCode(CaptchaFormat captchaFormat, bool isLetter)
        {
            string code = string.Empty;
            string result = string.Empty;
            switch (captchaFormat)
            {
                case Domain.Enums.CaptchaFormat.Number:
                    code = GetRandomCode();
                    result = code;
                    break;
                case Domain.Enums.CaptchaFormat.Character:
                    code = GetRandomCharacter();
                    result = code;
                    break;
                case Domain.Enums.CaptchaFormat.Sum:
                    var rs = GenerateSum(isLetter);
                    code = rs.code;
                    result = rs.result;
                    break;
                case Domain.Enums.CaptchaFormat.Submission:
                    var rsu = GenerateSubmission(isLetter);
                    code = rsu.code;
                    result = rsu.result;
                    break;
                case Domain.Enums.CaptchaFormat.Multiple:
                    var m = GenerateMultiplication(isLetter);
                    code = m.code;
                    result = m.result;
                    break;
            }
            return (code, result);
        }
        private string GetRandomCode()
        {
            int digitNumber = _captchaConfig.CurrentValue.DigitNumber;
            if (digitNumber < 4 || digitNumber > 9)
                digitNumber = 4;
            var min = (int)Math.Pow(10, digitNumber);
            var max = ((int)Math.Pow(10, digitNumber + 1)) - 1;
            return (new Random().Next(min, max)).ToString();
        }
        private string GetRandomCharacter()
        {
            int digitNumber = _captchaConfig.CurrentValue.DigitNumber;
            if (digitNumber < 4 || digitNumber > 9)
                digitNumber = 4;
            return Extensions.GetUniqueKey(digitNumber);
        }
        private (string code, string result) GenerateSum(bool isLetter)
        {
            var Rand1 = new Random().Next(1, 20);
            var Rand2 = new Random().Next(1, 20);
            var code = string.Format("{0} + {1}", Rand1, Rand2);
            if (isLetter)
                code = string.Format("{0} به اضافه {1}", ConvertDigitToPersian(Rand1), ConvertDigitToPersian(Rand2));
            var result = Rand1 + Rand2;
            return (code, result.ToString());
        }
        private (string code, string result) GenerateSubmission(bool isLetter)
        {
            var Rand1 = new Random().Next(10, 20);
            var Rand2 = new Random().Next(1, 9);
            var code = string.Format("{0} - {1}", Rand1, Rand2);
            if (isLetter)
                code = string.Format("{0} منهای {1}", ConvertDigitToPersian(Rand1), ConvertDigitToPersian(Rand2));
            var result = Rand1 - Rand2;
            return (code, result.ToString());
        }
        private (string code, string result) GenerateMultiplication(bool isLetter)
        {
            var Rand1 = new Random().Next(1, 9);
            var Rand2 = new Random().Next(1, 9);
            var code = string.Format("{0} x {1}", Rand1, Rand2);
            if (isLetter)
                code = string.Format("{0} ضرب در {1}", ConvertDigitToPersian(Rand1), ConvertDigitToPersian(Rand2));
            var result = Rand1 * Rand2;
            return (code, result.ToString());
        }


        private string ConvertDigitToPersian(int digit)
        {
            switch (digit)
            {
                case 1:
                    return "یک";
                case 2:
                    return "دو";
                case 3:
                    return "سه";
                case 4:
                    return "چهار";
                case 5:
                    return "پنج";
                case 6:
                    return "شش";
                case 7:
                    return "هفت";
                case 8:
                    return "هشت";
                case 9:
                    return "نه";
                case 10:
                    return "ده";
                case 11:
                    return "یازده";
                case 12:
                    return "دوازده";
                case 13:
                    return "سیزده";
                case 14:
                    return "چهارده";
                case 15:
                    return "پانزده";
                case 16:
                    return "شانزده";
                case 17:
                    return "هفده";
                case 18:
                    return "هجده";
                case 19:
                    return "نوزده";
                case 20:
                    return "بیست";
            }
            return string.Empty;
        }


    }
}
