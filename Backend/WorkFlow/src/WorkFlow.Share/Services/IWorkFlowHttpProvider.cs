using MediatR;
using Refit;
using Share.Application.Common.Models;
using Share.Domain.Models;
using WorkFlow.Application.ContextMaps.Archives.Queries.GetUserArchives;
using WorkFlow.Application.ContextMaps.Cardboard.Queries.GetMarketMakerOrder;
using WorkFlow.Application.ContextMaps.Cardboard.Queries.GetUserCardboard;
using WorkFlow.Application.ContextMaps.Cardboard.Queries.GetUserCardboardRecords;
using WorkFlow.Application.ContextMaps.Forms.Command.CheckIsOrderInCardbord;
using WorkFlow.Application.ContextMaps.Forms.Command.CloseForm;
using WorkFlow.Application.ContextMaps.Forms.Command.ConditionalConfirmForm;
using WorkFlow.Application.ContextMaps.Forms.Command.ConfirmForm;
using WorkFlow.Application.ContextMaps.Forms.Command.DenyForm;
using WorkFlow.Application.ContextMaps.Forms.Command.RejectForm;
using WorkFlow.Application.ContextMaps.Forms.Queries.GetFormByFormId;
using WorkFlow.Application.ContextMaps.Forms.Queries.GetForms;
using WorkFlow.Application.ContextMaps.Funds.Command.SaveFund;
using WorkFlow.Application.ContextMaps.Funds.Queries.GetFunds;
using WorkFlow.Application.ContextMaps.MarketMakerUserGroups.Queries.GetGroups;
using WorkFlow.Application.ContextMaps.MarketMakerUsers.Command.SaveUser;
using WorkFlow.Application.ContextMaps.MarketMakerUsers.Queries.GetUsers;
using WorkFlow.Application.ContextMaps.MarketMakerUsers.Queries.GetWorkflowUserByUserId;
using WorkFlow.Application.ContextMaps.MarketMakerUsers.Queries.GetWorkflowUserByUserIds;
using WorkFlow.Application.ContextMaps.Orders.Command.ObservedOrder;
using WorkFlow.Application.ContextMaps.Orders.Command.SaveCashMarketOrder;
using WorkFlow.Application.ContextMaps.Orders.Command.SaveDraftOrder;
using WorkFlow.Application.ContextMaps.Orders.Command.SaveOrder;
using WorkFlow.Application.ContextMaps.Orders.Command.UpdateExtraInfo;
using WorkFlow.Application.ContextMaps.Orders.Command.UpdateOrderStatusByGuideId;
using WorkFlow.Application.ContextMaps.Orders.Queries.GetOrderDraftByUserId;
using WorkFlow.Application.ContextMaps.Orders.Queries.GetOrders;
using WorkFlow.Application.ContextMaps.WorkFlow.Query.GetWorkFlowById;
using WorkFlow.Application.ContextMaps.WorkFlowArchives.Queries.GetWorkFlowArchive;
using WorkFlow.Domain.Entities;

namespace WorkFlow.Share.Services
{
    public interface IWorkFlowHttpProvider
    {

        #region Archive
        [Get("/WorkFlow/api/v1/Archive/UserArchive/fa")]
        Task<PaginatedList<UserArchivesResponse>> UserArchive(GetUserArchivesQuery request = default);

        #endregion

        #region User
        [Get("/WorkFlow/api/v1/User/WorkFlowUserList/fa")]
        Task<PaginatedList<WorkFlowUserResponse>> WorkFlowUserList(WorkFlowUserListQuery request = default);
        [Get("/WorkFlow/api/v1/User/WorkFlowUserAll/fa")]
        Task<List<SimpleWorkFlowUserResponse>> WorkFlowUserAll(WorkFlowUserAllQuery request = default);

        [Post("/WorkFlow/api/v1/User/Save")]
        Task<WorkFlowUserResponse> Save(WorkFlowUserSaveCommand request = default);

        [Get("/WorkFlow/api/v1/User/WorkflowUserByUserId/fa")]
        Task<WorkFlowUserResponse> WorkflowUserByUserId(GetWorkflowUserByUserIdQuery request = default);
        [Get("/WorkFlow/api/v1/User/WorkflowUserByUserIds/fa")]
        Task<List<WorkFlowUserResponse>> WorkflowUserByUserIds(GetWorkflowUserByUserIdsQuery request = default);

        #endregion

        #region UserGroup
        [Get("/WorkFlow/api/v1/UserGroup/WorkFlowGroupList/fa")]
        Task<PaginatedList<WorkFlowGroupResponse>> WorkFlowGroupList(WorkFlowGroupListQuery request = default);


        //[Delete("/WorkFlow/api/v1/UserGroup/Delete/{WorkFlowUserGroupId}")]
        //Task<Unit> Delete(WorkFlowUserGroupId WorkFlowUserGroupId);


        //[Post("/WorkFlow/api/v1/UserGroup/Save")]
        //Task<WorkFlowGroupResponse> Save(WorkFlowGroupSaveCommand request = default);

        #endregion

        #region Order
        [Get("/WorkFlow/api/v1/Order/WorkFlowType")]
        Task<List<EnumInfo>> WorkFlowType();
        [Get("/WorkFlow/api/v1/Order/OrderList/fa")]
        Task<PaginatedList<OrderResponse>> OrderList(OrderListQuery request = default);

        [Get("/WorkFlow/api/v1/Order/GetOrder/fa")]
        Task<OrderResponse> GetOrder(GetOrderQuery request = default);

        [Get("/WorkFlow/api/v1/Order/GetOrderDraftByUserId/fa")]
        Task<List<Order>> GetOrderDraftByUserId(GetOrderDraftByUserIdQuery request = default);
        //[Get("/WorkFlow/api/v1/Order/GetOrdersByWorkFlowUsers/fa")]
        //Task<List<OrderResponse>> GetOrdersByWorkFlowUsers(GetOrdersByWorkFlowUsersQuery request = default);


        [Post("/WorkFlow/api/v1/Order/Submit")]
        Task<OrderResponse> Submit(OrderSaveCommand request = default);

        [Post("/WorkFlow/api/v1/Order/SubmitDraft")]
        Task<OrderResponse> SubmitDraft(SaveDraftOrderCommand request = default);

        [Post("/WorkFlow/api/v1/Order/SubmitCashMarket")]
        Task<OrderResponse> SubmitCashMarket(SaveCashMarketOrderCommand request = default);

        [Post("/WorkFlow/api/v1/Order/UpdateExtraInfo")]
        Task<OrderResponse> UpdateExtraInfo(UpdateExtraInfoCommand request = default);
        [Post("/WorkFlow/api/v1/Order/ObservedOrder")]
        Task<Unit> ObservedOrder(ObservedOrderCommand request = default);
        [Post("/WorkFlow/api/v1/Order/UpdateOrderStatusByGuideId")]
        Task<Unit> UpdateOrderStatusByGuideId(UpdateOrderStatusByGuideIdCommand request = default);

        #endregion

        #region Form
        [Get("/WorkFlow/api/v1/Forms/Forms")]
        Task<List<EnumInfo>> Forms();
        [Get("/WorkFlow/api/v1/Forms/GetFormByFormId")]
        Task<FormResponse> GetFormByFormId(GetFormByFormIdQuery request = default);

        [Get("/WorkFlow/api/v1/Forms/OrderDetailFormById/fa")]
        Task<OrderDetailFormByIdResponse> OrderDetailFormById(GetOrderDetailFormById request = default);
        [Get("/WorkFlow/api/v1/Forms/OrderWorkFlowById/fa")]
        Task<OrderWorkFlowResponse> OrderWorkFlowById(GetOrderWorkFlowById request = default);


        [Post("/WorkFlow/api/v1/Forms/ConfirmForm")]
        Task<Unit> ConfirmForm(ConfirmFormCommand request = default);

        [Post("/WorkFlow/api/v1/Forms/ConditionalConfirmForm")]
        Task<Unit> ConditionalConfirmForm(ConditionalConfirmFormCommand request = default);

        [Post("/WorkFlow/api/v1/Forms/RejectForm")]
        Task<Unit> RejectForm(RejectFormCommand request = default);
        [Post("/WorkFlow/api/v1/Forms/DenyForm")]
        Task<Unit> DenyForm(DenyFormCommand request = default);


        [Post("/WorkFlow/api/v1/Forms/CloseForm")]
        Task<Unit> CloseForm(CloseFormCommand request = default);

        [Post("/WorkFlow/api/v1/Forms/IsOrderInCardbord")]
        Task<bool> IsOrderInCardbord(IsOrderInCardbord request = default);

        #endregion

        #region UserCardboard
        [Get("/WorkFlow/api/v1/Cardboard/UserCardboard/fa")]
        Task<PaginatedList<UserCardboardResponse>> UserCardboard(GetUserCardboardQuery request = default);

        [Post("/WorkFlow/api/v1/Cardboard/PostUserCardboard/fa")]
        Task<PaginatedList<UserCardboardResponse>> PostUserCardboard(PostUserCardboardQuery request = default);


        [Get("/WorkFlow/api/v1/Cardboard/UserCardboardRecord/fa")]
        Task<PaginatedList<UserCardboardRecordResponse>> UserCardboardRecord(GetUserCardboardRecordQuery request = default);

        [Post("/WorkFlow/api/v1/Cardboard/PostUserCardboardRecord/fa")]
        Task<PaginatedList<UserCardboardRecordResponse>> PostUserCardboardRecord(PostUserCardboardRecordQuery request = default);

        [Get("/WorkFlow/api/v1/Cardboard/UserCardboardRecordAll/fa")]
        Task<List<UserCardboardRecordResponse>> UserCardboardRecordAll(GetUserCardboardRecordQueryAll request = default);



        [Get("/WorkFlow/api/v1/Cardboard/WorkFlowOrders/fa")]
        Task<PaginatedList<WorkFlowOrderResponse>> WorkFlowOrders(GetWorkFlowOrderQuery request = default);
        [Get("/WorkFlow/api/v1/Cardboard/WorkFlowOrdersAll/fa")]
        Task<List<WorkFlowOrderResponse>> WorkFlowOrdersAll(GetWorkFlowOrderQueryAll request = default);



        [Post("/WorkFlow/api/v1/Cardboard/UserCardboardById")]
        Task<List<UserCardboardResponse>> UserCardboardById(UserCardboardByIdQuery request = default);
        [Post("/WorkFlow/api/v1/Cardboard/UserCardboardRecordById")]
        Task<List<UserCardboardRecordResponse>> UserCardboardRecordById(UserCardboardRecordByIdQuery request = default);




        #endregion

        #region WorkFlowArchive

        [Get("/WorkFlow/api/v1/UserGroup/WorkFlowArchive/fa")]
        Task<PaginatedList<WorkFlowArchiveResponse>> WorkFlowArchive(GetWorkFlowArchiveQuery request = default);
        #endregion

        #region Fund
        [Get("/WorkFlow/api/v1/Fund/FundList/fa")]
        Task<PaginatedList<FundResponse>> FundList(FundListQuery request = default);

        //[Get("/WorkFlow/api/v1/Fund/FundById/fa")]
        //Task<PaginatedList<FundResponse>> FundById(FundListQuery request = default);

        [Get("/WorkFlow/api/v1/Fund/FundAll/fa")]
        Task<List<FundResponse>> FundAll(FundAllQuery request = default);


        [Delete("/WorkFlow/api/v1/Fund/Delete/fa")]
        Task<Unit> FundDelete(Guid fundId);


        [Post("/WorkFlow/api/v1/Fund/Save")]
        Task<FundResponse> FundSave(FundSaveCommand request = default);


        #endregion


        #region WorkFlow

        [Get("/WorkFlow/api/v1/WorkFlow/WorkFlowById/fa")]
        Task<WorkFlowResponse> WorkFlowById(WorkFlowByIdQuery request = default);
        //[Get("/WorkFlow/api/v1/WorkFlow/GetWorkFlowUsersByBrokerId/fa")]
        //Task<List<WorkFlowUserResponse>> GetWorkFlowUsersByBrokerId(GetWorkFlowUsersByBrokerIdQuery request = default);

        #endregion
    }
}


