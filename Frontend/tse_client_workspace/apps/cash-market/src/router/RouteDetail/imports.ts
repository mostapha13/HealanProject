import { lazy, Outlet } from '@tse/utils';

export const Cartable = lazy(() => import('../../pages/Cartable'));
export const RequestStartMarketing = lazy(
  () => import('../../pages/MarketMaker/RequestStartMarketing')
);
export const RejectionReason = lazy(
  () => import('../../pages/BasicData/RejectionReason')
);
export const InstrumentParameter = lazy(
  () => import('../../pages/BasicData/InstrumentParameter')
);
export const CallbackPage = lazy(() => import('../../pages/CallBack'));
export const UserManagement = lazy(
  () => import('../../pages/Setting/UserManagement')
);
export const MarketingFund = lazy(
  () => import('../../pages/BasicData/MarketingFund')
);
export const Instrument = lazy(
  () => import('../../pages/BasicData/Instrument')
);
export const RequestDetails = lazy(
  () => import('../../pages/MarketMaker/RequestDetails')
);
// export const InstructionInfo = lazy(() => import('../../pages/InstructionInfo'));
export const Profile = lazy(() => import('../../pages/Profile'));
export const CancelRequest = lazy(
  () => import('../../pages/MarketMaker/CancelRequest')
);
export const ProfileDetail = lazy(() => import('../../pages/ProfileDetail'));
export const AccessRequestDetail = lazy(
  () => import('../../pages/MarketMaker/AccessRequestDetail')
);
export const QuitReason = lazy(
  () => import('../../pages/BasicData/QuitReason')
);
export const MarketParameter = lazy(
  () => import('../../pages/BasicData/MarketParameter')
);
export const ExtendingTime = lazy(
  () => import('../../pages/BasicData/ExtendingTime')
);
// export const ParameterReport = lazy(() => import('../../pages/ParameterReport'));
// export const InstrumentView = lazy(() => import('../../pages/InstrumentView'));
export const RequestReport = lazy(
  () => import('../../pages/MarketMaker/Reports/RequestReport')
);
export const InstrumentList = lazy(
  () => import('../../pages/NewInstrumentPages/InstrumentList')
);
export const NewInstrument = lazy(
  () => import('../../pages/NewInstrumentPages/NewInstrument')
);
export const InstrumentTradeOptionDetails = lazy(
  () =>
    import(
      '../../pages/NewInstrumentPages/InstrumentDetails/InstrumentTradeOptionDetails'
    )
);
export const InstrumentOptionDetails = lazy(
  () =>
    import(
      '../../pages/NewInstrumentPages/InstrumentDetails/InstrumentOptionDetails'
    )
);
export const InstrumentFutureDetails = lazy(
  () =>
    import(
      '../../pages/NewInstrumentPages/InstrumentDetails/InstrumentFutureDetails'
    )
);
export const InstrumentDebitDetails = lazy(
  () =>
    import(
      '../../pages/NewInstrumentPages/InstrumentDetails/InstrumentDebitDetails'
    )
);
export const BlockTransaction = lazy(
  () => import('../../pages/StockMarket/Block/BlockTransaction')
);
export const BlockTransactionPreview = lazy(
  () => import('../../pages/StockMarket/Block/BlockTransactionPreview')
);
export const BlockRequestTracking = lazy(
  () => import('../../pages/StockMarket/Block/BlockRequestTracking')
);
export const BlockRequestDetails = lazy(
  () => import('../../pages/StockMarket/Block/BlockRequestDetails')
);
export const BlockCartable = lazy(
  () => import('../../pages/StockMarket/Block/BlockCartable')
);
export const BlockChangeStatus = lazy(
  () => import('../../pages/StockMarket/Block/BlockChangeStatus')
);

export const InstrumentFundDetails = lazy(
  () =>
    import(
      '../../pages/NewInstrumentPages/InstrumentDetails/InstrumentFundDetails'
    )
);
export const RequestTransferStock = lazy(
  () => import('../../pages/StockMarket/TransferStock/Request')
);
export const RequestDetailsTransferStock = lazy(
  () => import('../../pages/StockMarket/TransferStock/RequestDetails')
);
export const SetDeadLineTransferStock = lazy(
  () => import('../../pages/StockMarket/TransferStock/SetDeadLine')
);
export const SendAttachmentTransferStock = lazy(
  () => import('../../pages/StockMarket/TransferStock/SendAttachment')
);
export const InitialSupplyTransaction = lazy(
  () => import('../../pages/StockMarket/InitialSupply/Transaction')
);
export const InitialSupplyRequestDetails = lazy(
  () => import('../../pages/StockMarket/InitialSupply/RequestDetails')
);
export const WholesaleCashRequest = lazy(
  () => import('../../pages/StockMarket/Wholesale/Sale/Cash/Request')
);
export const WholeSaleSellRequestTracking = lazy(
  () => import('../../pages/StockMarket/Wholesale/Sale/Cash/Tracking')
);
export const WholeSaleSellRequestDetailsExpert = lazy(
  () =>
    import('../../pages/StockMarket/Wholesale/Sale/Cash/RequestDetailsExpert')
);
export const WholeSaleSellRequestDetails = lazy(
  () => import('../../pages/StockMarket/Wholesale/Sale/Cash/RequestDetails')
);
export const RequestChangeParameter = lazy(
  () => import('../../pages/MarketMaker/RequestChangeParameter')
);
export const RequestChangeParameterDetails = lazy(
  () => import('../../pages/MarketMaker/RequestChangeParameterDetails')
);
export const RequestChangeBroker = lazy(
  () => import('../../pages/MarketMaker/RequestChangeBroker')
);
export const RequestChangeBrokerDetails = lazy(
  () => import('../../pages/MarketMaker/RequestChangeBrokerDetails')
);
export const MessagesList = lazy(() => import('../../pages/Messages'));
export const ParameterReports = lazy(
  () => import('../../pages/MarketMaker/Reports/ParameterReports')
);
export const InstrumentMarketMaker = lazy(
  () => import('../../pages/MarketMaker/Reports/InstrumentMarketMaker')
);
export const ManageRole = lazy(() => import('../../pages/Setting/ManageRole'));
export const ChangeParameterReport = lazy(
  () => import('../../pages/MarketMaker/Reports/ChangeParameterReport')
);
export const RequestBuyAdList = lazy(
  () => import('../../pages/StockMarket/Wholesale/Buy/AdList')
);
export const RequestBuyWholeSale = lazy(
  () => import('../../pages/StockMarket/Wholesale/Buy/Request')
);
export const RequestDetailBuyWholeSale = lazy(
  () => import('../../pages/StockMarket/Wholesale/Buy/RequestDetail')
);
export const CancelRequestBuyWholesaleList = lazy(
  () => import('../../pages/StockMarket/Wholesale/Buy/Cancellation/List')
);
export const RequestCancelBuyWholesale = lazy(
  () => import('../../pages/StockMarket/Wholesale/Buy/Cancellation/Request')
);
export const RequestDetailCancelBuyWholesale = lazy(
  () =>
    import('../../pages/StockMarket/Wholesale/Buy/Cancellation/RequestDetail')
);
export const CancelRequestSellWholesaleList = lazy(
  () => import('../../pages/StockMarket/Wholesale/Sale/Cancellation/List')
);
export const CancelRequestSellWholesale = lazy(
  () => import('../../pages/StockMarket/Wholesale/Sale/Cancellation/Request')
);
export const CancelRequestDetailSellWholesale = lazy(
  () =>
    import('../../pages/StockMarket/Wholesale/Sale/Cancellation/RequestDetail')
);
export const CertaintySellWholesaleList = lazy(
  () => import('../../pages/StockMarket/Wholesale/Sale/Certainty/List')
);
export const CertaintySellWholesaleRequest = lazy(
  () => import('../../pages/StockMarket/Wholesale/Sale/Certainty/Request')
);
export const CertaintySellWholesaleDetail = lazy(
  () => import('../../pages/StockMarket/Wholesale/Sale/Certainty/RequestDetail')
);
export const NotCertaintyList = lazy(
  () => import('../../pages/StockMarket/Wholesale/Sale/NotCertainty/List')
);
export const NotCertaintyRequest = lazy(
  () => import('../../pages/StockMarket/Wholesale/Sale/NotCertainty/Request')
);
export const TransactionDayList = lazy(
  () => import('../../pages/StockMarket/Wholesale/Sale/TransactionDay/List')
);
export const TransactionDaySeller = lazy(
  () =>
    import('../../pages/StockMarket/Wholesale/Sale/TransactionDay/SellerList')
);
export const ReportTransactionDay = lazy(
  () => import('../../pages/StockMarket/Report/TransactionDay')
);
export const CertaintyReport = lazy(
  () => import('../../pages/StockMarket/Report/CertaintyReport')
);

////////////////////////////////////Listing///////////////////////
export const AuditCompanies = lazy(
  () => import('../../pages/Listing/BasicData/AuditCompanies')
);

export const FinalSharedHolder = lazy(
  () => import('../../pages/Listing/BasicData/FinalShareholder')
);

export const FinalSharedHolderDetail = lazy(
  () => import('../../pages/Listing/BasicData/FinalShareholder/detail')
);

export const AuditCompaniesDetail = lazy(
  () => import('../../pages/Listing/BasicData/AuditCompanies/detail')
);


export const AcceptanceCompanies = lazy(
  () => import('../../pages/Listing/BasicData/AcceptanceCompanies')
);
export const AcceptanceCompaniesDetail = lazy(
  () => import('../../pages/Listing/BasicData//AcceptanceCompanies/Detail')
);

export const AdmissionsTeamMembers = lazy(
  () => import('../../pages/Listing/BasicData/AdmissionsTeamMembers')
);

export const AdmissionsTeamMembersDetail = lazy(
  () => import('../../pages/Listing/BasicData/AdmissionsTeamMembers/detail')
);

export const InvestmentFunds = lazy(
  () => import('../../pages/Listing/BasicData/InvestmentFunds')
);

export const InvestmentFundsDetail = lazy(
  () => import('../../pages/Listing/BasicData/InvestmentFunds/detail')
);

export const Users = lazy(() => import('../../pages/Listing/BasicData/Users'));

export const UsersDtail = lazy(
  () => import('../../pages/Listing/BasicData/Users/detail')
);

/////////////////////////////////////////////Listing Stock/////////////////////

export const NewListingDossier = lazy(
  () => import('../../pages/Listing/Stock/NewDossier')
);

export const DossierDetail = lazy(
  () => import('../../pages/Listing/Stock/NewDossier/detail')
);

export const DateModal = lazy(
  () => import('../../components/ListingModals/Date')
);

export const PercentModal = lazy(
  () => import('../../components/ListingModals/Percent')
);

export const NumericModal = lazy(
  () => import('../../components/ListingModals/Number')
);

export const AcceptanceFiles = lazy(
  () => import('../../pages/Listing/Stock/AcceptanceFiles')
);

/////////////////////////////////////////////Insidery/////////////////////
export const InsideryStuff = lazy(
  () => import('../../pages/Insidery/InsideryPage')
);

export const InsideryUser = lazy(() => import('../../pages/Insidery/Users'));

/////////////////////////////////corporate survey////////////////////////////////

export const SurveySubmitInfo = lazy(
  () => import('../../pages/CorporateSurvey/SubmitInfo')
);

/////////////////////////////////////////////Healan/////////////////////

export const Patient = lazy(
  () => import('../../pages/Healan/BasicData/Patients')
);

export const PatientDetail = lazy(
  () => import('../../pages/Healan/BasicData/Patients/Details')
);


export const Company = lazy(
  () => import('../../pages/Healan/BasicData/Companies')
);

export const CompanyDetail = lazy(
  () => import('../../pages/Healan/BasicData/Companies/details')
);

export const Appointment = lazy(
  () => import('../../pages/Healan/Appointment')
);

export const AppointmentDetail = lazy(
  () => import('../../pages/Healan/Appointment/detail')
);

export const Doctor = lazy(
  () => import('../../pages/Healan/BasicData/Doctors')
);

export const DoctorDetail = lazy(
  () => import('../../pages/Healan/BasicData/Doctors/details')
);

export const InvoiceDetail = lazy(
  () => import('../../pages/Healan/Appointment/detail')
);

export const GetOrder = lazy(
  () => import('../../pages/Healan/Order/detail')
);

// Healan Clinic — professional UI
export const HealanLayout = lazy(
  () => import('../../pages/Healan/Clinic/Layout/HealanLayout')
);
export const HealanDashboard = lazy(
  () => import('../../pages/Healan/Clinic/Dashboard')
);
export const HealanQueue = lazy(
  () => import('../../pages/Healan/Clinic/Queue')
);
export const HealanClinicAppointments = lazy(
  () => import('../../pages/Healan/Clinic/Appointments')
);
export const HealanClinicAppointmentDetail = lazy(
  () => import('../../pages/Healan/Clinic/Appointments/detail')
);
export const HealanClinicPatients = lazy(
  () => import('../../pages/Healan/Clinic/Patients')
);
export const HealanClinicDoctors = lazy(
  () => import('../../pages/Healan/Clinic/Doctors')
);
export const HealanClinicPrescriptions = lazy(
  () => import('../../pages/Healan/Clinic/Prescriptions')
);


