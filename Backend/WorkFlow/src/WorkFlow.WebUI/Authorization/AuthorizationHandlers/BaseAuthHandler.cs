using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Share.Application.Common.Authorization;
using Share.Domain.Models.UserAccessModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WorkFlow.WebUI.Authorization.AuthorizationHandlers
{
    public class BaseAuthHandler<TSection, TAction> : AbstractTseAuthHandler<TSection, TAction>
        where TSection : Enum
        where TAction : Enum
    {
        public BaseAuthHandler(TSection authorizationSection, TAction authorizationAction, params string[] roles) : base(authorizationSection, authorizationAction, roles)
        {

        }
        protected override void OnAuthorize(AuthorizationFilterContext context, TSection authorizationSection, TAction authorizationAction, params string[] roles)
        {
            //UnauthorizedAccess();
        }
    }
}
