using IdentityServer.ApplicationPolicy.Services;
using IdentityServer.Domain.Data;
using Share.Domain.Models.UserAccessModels;
using Share.MessageBroker.RabbitMQ.Constants;
using Share.MessageBroker.RabbitMQ.Models;
using Share.MessageBroker.RabbitMQ.Service;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using IdentityServer.Domain.Entities;
using IdentityServer.Domain.DTOs;
using Share.Domain.Exceptions;

namespace IdentityServer.ApplicationPolicy.Implementions
{
    public class UserAccessActionService : IUserAccessActionService
    {
       // private readonly IChannelProvider _channelProvider;
        private static readonly List<UserAccessSummary> _userAccessSummaries = new List<UserAccessSummary>();
        private readonly ApplicationDbContext _applicationDbContext;
        public UserAccessActionService( ApplicationDbContext applicationDbContext)
        {
            //_channelProvider = channelProvider;
            _applicationDbContext = applicationDbContext;
            //_channelProvider.SubscribeMessage<UserAccessSummary>((messageId, model) =>
            //{
            //    if (model != null && model.DisplayOrder > 0)
            //    {
            //        _userAccessSummaries.Add(model);
            //        return true;
            //    }
            //    return false;
            //}, (QueueNames.AccessInfo, QueueNames.AccessInfo));

        }
        public async Task UpdateUserAccessSummary()
        {
            _userAccessSummaries.Clear();
            //_channelProvider.PublishGlobalMessage(Guid.NewGuid().ToString(), new GlobalMessageModel() { Code = "-0" });
            await Task.Delay(1500);

            var SubSystemInfos = _applicationDbContext.SubSystemInfos.ToList();
            var SectionInfos = _applicationDbContext.SectionInfos.ToList();
            var ActionInfos = _applicationDbContext.ActionInfos.ToList();
            foreach (var _subSystem in _userAccessSummaries)
            {
                var SubSystemInfo = SubSystemInfos.FirstOrDefault(a => a.SubSystemInfoName == _subSystem.SubSystemName);
                if (SubSystemInfo == null)
                {
                    SubSystemInfo = new Domain.Entities.SubSystemInfo();
                    SubSystemInfo.SubSystemInfoName = _subSystem.SubSystemName;
                    _applicationDbContext.SubSystemInfos.Add(SubSystemInfo);
                }
                SubSystemInfo.DisplayName = _subSystem.DisplayName;
                SubSystemInfo.DisplayOrder = _subSystem.DisplayOrder;

                foreach (var _section in _subSystem.UserAccessSections)
                {
                    var sectionInfo = SectionInfos.FirstOrDefault(a => a.SectionInfoName == _section.SectionName);
                    if (sectionInfo == null)
                    {
                        sectionInfo = new Domain.Entities.SectionInfo();
                        sectionInfo.SectionInfoName = _section.SectionName;
                        SubSystemInfo.SectionInfos.Add(sectionInfo);
                    }
                    sectionInfo.DisplayName = _section.DisplayName;
                    sectionInfo.DisplayOrder = _section.DisplayOrder;



                    foreach (var _action in _section.UserAccessActions)
                    {
                        var actionInfo = ActionInfos.FirstOrDefault(a => a.ActionInfoName == _action.ActionName);
                        if (actionInfo == null)
                        {
                            actionInfo = new Domain.Entities.ActionInfo();
                            actionInfo.ActionInfoName = _action.ActionName;
                            sectionInfo.ActionInfos.Add(actionInfo);
                        }
                        actionInfo.DisplayName = _action.DisplayName;
                        actionInfo.DisplayOrder = _action.DisplayOrder;
                    }


                }
            }

            await _applicationDbContext.SaveChangesAsync();
        }
        public async Task<ICollection<UserAccessSummary>> GetUserAccessSummary(Guid? roleId, Guid? groupRoleId)
        {
            if (roleId == Guid.Empty)
                roleId = null;
            if (groupRoleId == Guid.Empty)
                groupRoleId = null;
            if (!roleId.HasValue && !groupRoleId.HasValue)
                throw new BadRequestExceptions($"roleId And groupRoleId is Null");

            var SubSystemInfos = _applicationDbContext.SubSystemInfos.ToList();
            var SectionInfos = _applicationDbContext.SectionInfos.ToList();
            var ActionInfos = _applicationDbContext.ActionInfos.ToList();
            var accessInfo = _applicationDbContext.ApplicationUserAccesses.Where(w => (roleId.HasValue && w.ApplicationRoleId == roleId) || (groupRoleId.HasValue && w.ApplicationRoleGroupId == groupRoleId)).ToList();

            List<ApplicationUserAccess> applicationUserGroupAccesses = null;
            if (roleId.HasValue)
            {

                var role = _applicationDbContext.Roles.FirstOrDefault(p => p.Id == roleId);
                if (role != null && role.ApplicationRoleGroupId.HasValue)
                {
                    applicationUserGroupAccesses = await _applicationDbContext.ApplicationUserAccesses.Where(w => w.ApplicationRoleGroupId == role.ApplicationRoleGroupId).ToListAsync();
                }
            }

            List<UserAccessSummary> listUserAccessSummary = new List<UserAccessSummary>();
            foreach (var ss in SubSystemInfos)
            {
                var userAccessSummary = new UserAccessSummary()
                {
                    Key = ss.SubSystemInfoId,
                    SubSystemName = ss.SubSystemInfoName,
                    DisplayName = ss.DisplayName,
                    DisplayOrder = ss.DisplayOrder
                };
                listUserAccessSummary.Add(userAccessSummary);

                foreach (var si in SectionInfos.Where(w => w.SubSystemId == userAccessSummary.Key))
                {
                    UserAccessSection userAccessSection = new UserAccessSection()
                    {
                        Key = si.SectionInfoId,
                        SectionName = si.SectionInfoName,
                        DisplayName = si.DisplayName,
                        DisplayOrder = si.DisplayOrder
                    };
                    ((List<UserAccessSection>)userAccessSummary.UserAccessSections).Add(userAccessSection);

                    foreach (var ai in ActionInfos.Where(w => w.SectionInfoId == userAccessSection.Key))
                    {
                        List<ApplicationUserAccess> tmpaccessInfo = accessInfo.Where(w => w.ActionInfoId == ai.ActionInfoId).ToList();
                        List<ApplicationUserAccess> tmpapplicationUserGroupAccesses = null;
                        if (applicationUserGroupAccesses != null)
                        {
                            tmpapplicationUserGroupAccesses = applicationUserGroupAccesses.Where(w => w.ActionInfoId == ai.ActionInfoId).ToList();
                        }
                        UserAccessAction userAccessAction = new UserAccessAction()
                        {
                            Key = ai.ActionInfoId,
                            ActionName = ai.ActionInfoName,
                            DisplayName = ai.DisplayName,
                            DisplayOrder = ai.DisplayOrder,
                            AccessMode = (AccessMode)(tmpaccessInfo.FirstOrDefault()?.AccessMode),
                            HasAccess = tmpaccessInfo.Any() &&
                            (
                            tmpaccessInfo.All(z => z.AccessMode == AccessMode.HasAccess) ||
                            (
                            tmpaccessInfo.All(z => z.AccessMode == AccessMode.GroupAccess) &&
                            tmpapplicationUserGroupAccesses != null && tmpapplicationUserGroupAccesses.Any() &&
                            tmpapplicationUserGroupAccesses.All(z => z.AccessMode == AccessMode.HasAccess)
                            )
                            )
                        };
                        ((List<UserAccessAction>)userAccessSection.UserAccessActions).Add(userAccessAction);


                    }

                }

            }
            return listUserAccessSummary;

        }

        public async Task<ICollection<UserAccessSummary>> SetAccess(SetAccessViewModel setAccessViewModel)
        {
            if (setAccessViewModel == null)
                throw new BadRequestExceptions();
            if (!setAccessViewModel.SubsystemId.HasValue && !setAccessViewModel.SectionId.HasValue && !setAccessViewModel.ActionId.HasValue)
                throw new BadRequestExceptions($"SubsystemId And SectionId And ActionId Is Null!");
            if (!setAccessViewModel.RoleId.HasValue && !setAccessViewModel.GroupRoleId.HasValue)
                throw new BadRequestExceptions($"RoleId And GroupRoleId Is Null!");
            if (setAccessViewModel.RoleId.HasValue && setAccessViewModel.GroupRoleId.HasValue)
                throw new BadRequestExceptions($"RoleId And GroupRoleId Has Value");


            List<int> listActionId = new List<int>();
            if (setAccessViewModel.SubsystemId.HasValue)
            {
                var subSystemInfo = _applicationDbContext.SubSystemInfos.Include(a => a.SectionInfos).ThenInclude(b => b.ActionInfos).FirstOrDefault(p => p.SubSystemInfoId == setAccessViewModel.SubsystemId);
                foreach (var ssi in subSystemInfo.SectionInfos)
                {
                    foreach (var ai in ssi.ActionInfos)
                    {
                        listActionId.Add(ai.ActionInfoId);
                    }
                }
            }
            else if (setAccessViewModel.SectionId.HasValue)
            {
                var sectionInfo = _applicationDbContext.SectionInfos.Include(b => b.ActionInfos).FirstOrDefault(p => p.SectionInfoId == setAccessViewModel.SectionId);
                foreach (var ai in sectionInfo.ActionInfos)
                {
                    listActionId.Add(ai.ActionInfoId);
                }
            }
            else if (setAccessViewModel.ActionId.HasValue)
            {
                var ai = _applicationDbContext.ActionInfos.FirstOrDefault(p => p.ActionInfoId == setAccessViewModel.ActionId);
                listActionId.Add(ai.ActionInfoId);
            }
            var allAccess = await _applicationDbContext.ApplicationUserAccesses.Where(w => w.ApplicationRoleId == setAccessViewModel.RoleId && w.ApplicationRoleGroupId == setAccessViewModel.GroupRoleId).ToListAsync();
            var allAccessId = allAccess.Select(s => s.ActionInfoId).ToList();

            var mustDeleted = allAccess.Where(a => listActionId.Contains(a.ActionInfoId));
            _applicationDbContext.ApplicationUserAccesses.RemoveRange(mustDeleted);
            foreach (var item in listActionId)
            {
                _applicationDbContext.ApplicationUserAccesses.Add(new ApplicationUserAccess()
                {
                    AccessMode = setAccessViewModel.AccessMode,
                    ActionInfoId = item,
                    ApplicationRoleGroupId = setAccessViewModel.GroupRoleId,
                    ApplicationRoleId = setAccessViewModel.GroupRoleId,
                });
            }
            await _applicationDbContext.SaveChangesAsync();

            return await GetUserAccessSummary(setAccessViewModel.RoleId, setAccessViewModel.GroupRoleId);

        }
    }
}
