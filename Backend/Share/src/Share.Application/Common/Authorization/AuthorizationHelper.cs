using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Share.Domain.Extensions;
using Share.Domain.Models;
using Share.Domain.Models.UserAccessModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace Share.Application.Common.Authorization
{
    public static class AuthorizationHelper
    {
        public static UserAccessSummary GetAuthorizationInfo<T>(this Assembly assembly,string subsystemName,string displayName,int displayOrder) where T:Enum
        {

            UserAccessSummary userAccessSummary = new UserAccessSummary() {SubSystemName=subsystemName,DisplayOrder=displayOrder,DisplayName= displayName };
            userAccessSummary.RoleInfos =  typeof(T).GetEnumInfo().OrderBy(o=>o.DisplayOrder).ToList();


            var controlleractionlist = assembly.GetTypes()
        .Where(type => typeof(ControllerBase).IsAssignableFrom(type))
        .SelectMany(type => type.GetMethods(BindingFlags.Instance | BindingFlags.DeclaredOnly | BindingFlags.Public))
        .Where(m => m.GetCustomAttributes(typeof(TseAuth), true).Any())
        .Select(x => new
        {
            Controller = x.DeclaringType.Name,
            Action = x.Name,
            ReturnType = x.ReturnType.Name,
            Attribute = x.GetCustomAttributes().Where(a => a.GetType() == typeof(TseAuth)).FirstOrDefault()
        })
        .OrderBy(x => x.Controller).ThenBy(x => x.Action).ToList();


            foreach (var item in controlleractionlist)
            {
                var handlerType = item.Attribute.GetType().GetProperty("HandlerType").GetValue(item.Attribute) as Type;
                var tseAuthHandler = handlerType.BaseType;

                var AuthorizationSectionInfo = tseAuthHandler.GetProperty("AuthorizationSection").PropertyType.GetEnumInfo();
                var AuthorizationActionInfo = tseAuthHandler.GetProperty("AuthorizationAction").PropertyType.GetEnumInfo();


                var AuthorizationSection = (int)item.Attribute.GetType().GetProperty("AuthorizationSection").GetValue(item.Attribute);
                var AuthorizationAction = (int)item.Attribute.GetType().GetProperty("AuthorizationAction").GetValue(item.Attribute);
                //var Options = (byte[])item.Attribute.GetType().GetProperty("Options").GetValue(item.Attribute);

                AuthorizationSectionInfo = AuthorizationSectionInfo.Where(w => w.Key == AuthorizationSection).ToList();
                AuthorizationActionInfo = AuthorizationActionInfo.Where(w => w.Key == AuthorizationAction).ToList();


                AddAccessItem(userAccessSummary, AuthorizationSectionInfo, AuthorizationActionInfo);
            }

            OrderItems(userAccessSummary);
            return userAccessSummary;
        }
        private static void AddRole(UserAccessSummary userAccessSummary,List<EnumInfo> roleInfos)
        {
            foreach (var roleInfo in roleInfos)
            {
                if (!userAccessSummary.RoleInfos.Any(a => a.Key == roleInfo.Key))
                    ((List<EnumInfo>)userAccessSummary.RoleInfos).Add(roleInfo);
            }
        }
        private static void AddAccessItem(UserAccessSummary userAccessSummary, List<EnumInfo> sectionInfos, List<EnumInfo> actionInfos)
        {
            foreach (var section in sectionInfos)
            {
                var currentSection = userAccessSummary.UserAccessSections.FirstOrDefault(p => p.Key == section.Key);
                if (currentSection == null)
                {
                    currentSection = new UserAccessSection() {Key=section.Key,SectionName=section.Name,DisplayName=section.DisplayName,DisplayOrder=section.DisplayOrder };
                    ((List<UserAccessSection>)userAccessSummary.UserAccessSections).Add(currentSection);
                }

                foreach (var action in actionInfos)
                {
                    var currentAction = currentSection.UserAccessActions.FirstOrDefault(p => p.Key == action.Key);
                    if (currentAction == null)
                    {
                        currentAction = new UserAccessAction() { Key = action.Key, ActionName = action.Name, DisplayName = action.DisplayName, DisplayOrder = action.DisplayOrder };
                        ((List<UserAccessAction>)currentSection.UserAccessActions).Add(currentAction);
                    }
                }
            }
        }
        private static void OrderItems(UserAccessSummary userAccessSummary)
        {
            userAccessSummary.UserAccessSections = userAccessSummary.UserAccessSections.OrderBy(o => o.DisplayOrder).ToList();
            foreach (var section in userAccessSummary.UserAccessSections)
            {
                section.UserAccessActions = section.UserAccessActions.OrderBy(o => o.DisplayOrder).ToList();
            }
        }
    }
}
