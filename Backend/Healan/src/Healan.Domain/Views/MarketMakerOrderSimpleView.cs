using Healan.Domain.Views.Enums;
using Share.Domain.Enums;

namespace Healan.Domain.Views
{
    public class MarketMakerOrderSimpleView
    {
        public long row_num { get; set; }
        public Guid OrderId { get; set; }
        public OrderStatusId OrderStatusId { get; set; }
        public string TrackingNumber { get; set; }
        public bool IsDeleted { get; set; }
        public Guid? OrderParentId { get; set; }
        public DateTime? CreateDate { get; set; }
        public Guid? MarketMakerUserId { get; set; }
        public decimal? OrderDetail_BringCash { get; set; }
        public decimal? OrderDetail_BringShare { get; set; }
        public DateTime? OrderDetail_EndDate { get; set; }
        public bool? OrderDetail_IsDeny { get; set; }
        public DateTime? OrderDetail_StartDate { get; set; }
        public Guid? OrderDetail_FundId { get; set; }
        public string OrderDetail_FundName { get; set; }
        public DateTime? InstrumentParameter_CreateDate { get; set; }
        public Guid? InstrumentParameter_CreateUserId { get; set; }
        public DateTime? InstrumentParameter_FromDate { get; set; }
        public Guid? InstrumentParameter_InstrumentParameterId { get; set; }
        public long? InstrumentParameter_Invesment { get; set; }
        public long? InstrumentParameter_liquidity { get; set; }
        public int? InstrumentParameter_MaxOrder { get; set; }
        public int? InstrumentParameter_MinValue { get; set; }
        public long? InstrumentParameter_Oscillation { get; set; }
        public DateTime? InstrumentParameter_ToDate { get; set; }
        public decimal? InstrumentParameter_Tolerance { get; set; }
        public DateTime? InstrumentParameter_UpdateDate { get; set; }
        public DateTime? InstrumentParameter_UpdateUserId { get; set; }
        public string Instrument_CompanyName { get; set; }
        public Guid? Instrument_InstrumentId { get; set; }
        public long? Instrument_Investment { get; set; }
        public MarketTypeId? Instrument_MarketTypeId { get; set; }
        public string Instrument_Symbol { get; set; }
        public string Instrument_SymbolCode { get; set; }
        public string Instrument_SymbolName { get; set; }
        public ParameterChangeTypeId? ParameterChangeType_ParameterChangeTypeId { get; set; }
        public string ParameterChangeType_ParameterChangeTypeName { get; set; }
        public Guid? MarketMakerUser_BrokerId { get; set; }
        public string MarketMakerUser_FirstName { get; set; }
        public Guid? MarketMakerUser_FundId { get; set; }
        public Guid? MarketMakerUser_IdentityUserId { get; set; }
        public bool? MarketMakerUser_IsActive { get; set; }
        public bool? MarketMakerUser_IsConfirmed { get; set; }
        public string MarketMakerUser_LastName { get; set; }
        public int? MarketMakerUser_MarketMakerUserGroupId { get; set; }
        public Guid? MarketMakerUser_MarketMakerUserId { get; set; }
        public string MarketMakerUser_PhoneNumber { get; set; }

    }
}
