using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Newtonsoft.Json;
using Share.Domain.Models.UserAccessModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Application.Common.Authorization
{
    public abstract class AbstractTseAuthHandler<TSection, TAction> : IAuthorizationFilter
        where TSection : Enum
        where TAction : Enum
    {
        public AbstractTseAuthHandler(TSection authorizationSection, TAction authorizationAction, params string[] roles)
        {
            AuthorizationSection = authorizationSection;// (TSection)Enum.Parse(typeof(TSection), authorizationSection.ToString());
            AuthorizationAction = authorizationAction;// (TAction)Enum.Parse(typeof(TAction), authorizationAction.ToString());
            Roles = roles;
        }
        private AuthorizationFilterContext _context = null;
        public TSection AuthorizationSection { get; init; }
        public TAction AuthorizationAction { get; init; }
        public string[] Roles { get; init; }
        public void OnAuthorization(AuthorizationFilterContext context)
        {
            _context = context;
            OnAuthorize(context, AuthorizationSection, AuthorizationAction, Roles);
        }
        protected abstract void OnAuthorize(AuthorizationFilterContext context, TSection authorizationSection, TAction authorizationAction, params string[] roles);
        protected void UnauthorizedAccess(string message = "")
        {

            if (string.IsNullOrEmpty(message))
                message = "دسترسی برای ادامه عملیات وجود ندارد.";
            SetInContext(message);
        }
        private void SetInContext(string message = "")
        {
            //_context.Result = new UnauthorizedObjectResult(message);
            _context.Result = new ObjectResult(message) { StatusCode = StatusCodes.Status401Unauthorized };
        }

    }
}
