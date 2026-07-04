using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Share.Domain.Models.UserAccessModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Application.Common.Authorization
{
   public class TseAuth : TypeFilterAttribute
    {
        public TseAuth(Type handlerType, object authorizationSection, object authorizationAction,params  string[] authorizationRoles) :base(handlerType)
        {
            HandlerType = handlerType;
            AuthorizationSection = authorizationSection;
            AuthorizationAction = authorizationAction;
            AuthorizationRoles = authorizationRoles;
            Arguments = new object[]
            {
                authorizationSection,
                authorizationAction,
                authorizationRoles
            };
        }
        public Type HandlerType { get; init; }
        public object AuthorizationSection { get; init; }
        public object AuthorizationAction { get; init; }
        public string[] AuthorizationRoles { get; init; }
    }
}
