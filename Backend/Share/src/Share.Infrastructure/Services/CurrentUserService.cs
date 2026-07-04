using Microsoft.AspNetCore.Http;
using Share.Domain.Enums;
using System;
using System.Linq;
using System.Security.Claims;
using Share.Application.Common.Interfaces;

namespace Share.Infrastructure.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public Guid UserId
        {
            get
            {
#if DEBUG
                return Guid.Parse("5C0DE8F3-19EF-458B-8E9A-08DE3A4B0F18");
                //مشاور پذیرش
                //return Guid.Parse("18054438-053F-4258-1E44-08DDD72095F4");
                //کارشناس پذیرش
                //return Guid.Parse("997F5CBC-8C15-4D4A-1E45-08DDD72095F4");
                //مدیر پذیرش
                //return Guid.Parse("B7B307F3-9F63-431C-1E46-08DDD72095F4");
                //معاون پذیرش
                //return Guid.Parse("958BE975-472D-4706-1E47-08DDD72095F4");
                //پولشویی 
                //return Guid.Parse("50863D99-C8F5-4A1C-1E48-08DDD72095F4");


                //کارگزار
                //return Guid.Parse("D3B09F21-7BCE-41F0-273E-08DC3DA71E11");
                //کارشناس
                //return Guid.Parse("8C89C9AF-CC14-4C86-273F-08DC3DA71E11");
                //کارشناس مسئول
                //return Guid.Parse("460289D0-F14A-4882-2740-08DC3DA71E11");
                //رئیس اداره
                //return Guid.Parse("8DB0520B-D444-4732-2741-08DC3DA71E11");
                //مدیر
                //return Guid.Parse("6AFCCC76-CE41-4C51-2742-08DC3DA71E11");
                //معاون
                //return Guid.Parse("F9688ECA-88E0-4446-2743-08DC3DA71E11");
                //معاون ناشران
                //return Guid.Parse("7F293ABD-5F3B-4577-2744-08DC3DA71E11");
                //=======
                //return Guid.Parse("CDA56A93-046B-493A-C2AF-08DC10E23611");
                //>>>>>>> e870c935aad622bc20c3cbe266b889fe5d5ad696



                //2کارگزار
                //return Guid.Parse("8E495230-4E02-4A9A-97CE-08DCFD96EF44");
#endif

                if (Guid.TryParse(_httpContextAccessor.HttpContext?.User?.FindFirstValue("sub"), out var result))
                    return result;


                return Guid.Empty;
            }
        }

        public DepartmentId DepartmentId
        {
            get
            {
                object? result = null;
                if (Enum.TryParse(typeof(DepartmentId), _httpContextAccessor.HttpContext?.User?.FindFirstValue(Share.Domain.Constants.WellKnownNames.DepartmentClaimName), out result))
                    return (DepartmentId)result;
                return DepartmentId.None;
            }
        }

        public string AuthTime
        {
            get
            {
                return _httpContextAccessor.HttpContext?.User?.FindFirstValue("auth_time");
            }
        }
    }
}
