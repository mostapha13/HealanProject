import { Navbar } from '@tse/components/templates';
import { getCompanyList } from 'apps/cash-market/src/Controller/Listing/BasicData';
import { useEffect } from 'react';
import AdminPanel from 'apps/cash-market/src/assets/images/adminPanel.png';
import { Icon, Image, TextField } from '@tse/components/atoms';
import { useSearchParams, useStates } from '@tse/utils';
import emptyPicture from 'apps/cash-market/src/assets/images/emptyPicture.jpg';
import { Progress } from 'antd';
import LinearProgress from 'libs/components/atoms/src/lib/LinearProgress';
import {
  getMenus,
  getSubMenus,
} from 'apps/cash-market/src/Controller/Listing/PublicInfo';
import { DossierDateModal } from 'apps/cash-market/src/components/ListingModals/Date';
import { DossierPercentModal } from 'apps/cash-market/src/components/ListingModals/Percent';
import { DossierNumberModal } from 'apps/cash-market/src/components/ListingModals/Number';
import { DossierTextFieldModal } from 'apps/cash-market/src/components/ListingModals/TextField';
import { DossierSimpleSelectModal } from 'apps/cash-market/src/components/ListingModals/SimpleSelect';
import { DossierTextAreaModal } from 'apps/cash-market/src/components/ListingModals/TextArea';
import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { DossierFileModal } from 'apps/cash-market/src/components/ListingModals/File';
import { DossierFiscalYearModal } from 'apps/cash-market/src/components/ListingModals/FiscalYear';
import { DossierKnowledgeBasedModal } from 'apps/cash-market/src/components/ListingModals/KnowledgeBased';
import { DossierDateTextAreaModal } from 'apps/cash-market/src/components/ListingModals/DateTextArea';
import { DossierShareHolderModal } from 'apps/cash-market/src/components/ListingModals/ShareHolders';
import { deSeparator } from '@tse/tools';
import { DossierTreeSelectModal } from 'apps/cash-market/src/components/ListingModals/TreeSelect';
import { DossierFileDateModal } from 'apps/cash-market/src/components/ListingModals/FileDate';
import { DossierFileTextModal } from 'apps/cash-market/src/components/ListingModals/FileText';
import { DossierFileListModal } from 'apps/cash-market/src/components/ListingModals/FileList';
import { DossierFileTextAreaModal } from 'apps/cash-market/src/components/ListingModals/FileTextArea';
import { DossierFilePaymentReceiptModal } from 'apps/cash-market/src/components/ListingModals/FilePaymentReceipt';
import { DossierFileGeneralMeetingsMinutesModal } from 'apps/cash-market/src/components/ListingModals/FileGeneralMeetingsMinutes';
import { DossierFileLast2YearChangeModal } from 'apps/cash-market/src/components/ListingModals/FileLast2YearChange';
import { DossierFileCompanyInsidersDetailsModal } from 'apps/cash-market/src/components/ListingModals/FileCompanyInsidersDetails';
import { DossierValueAddedTaxModal } from 'apps/cash-market/src/components/ListingModals/FileValueAddedTax';
import { DossierFileActivityPermitModal } from 'apps/cash-market/src/components/ListingModals/FileActivityPermit';
import { DossierCompanyStockCertificateImageModal } from 'apps/cash-market/src/components/ListingModals/CompanyStockCertificateImage';
import { DossierFileAllPendingLawsuitsModal } from 'apps/cash-market/src/components/ListingModals/FileAllPendingLawsuits';
import { DossierFileAuditorLetterModal } from 'apps/cash-market/src/components/ListingModals/FileAuditorLetter';
import { DossierFileMajorAssetsAndOwnershipDocumentsModal } from 'apps/cash-market/src/components/ListingModals/FileMajorAssetsAndOwnershipDocuments';
import { DossierFileOtherDocumentsModal } from 'apps/cash-market/src/components/ListingModals/FileOtherDocuments';
import { DossierFileInquiryApplicantCompanyModal } from 'apps/cash-market/src/components/ListingModals/FileInquiryApplicantCompany';
import { DossierFileAdmissionsBoardModal } from 'apps/cash-market/src/components/ListingModals/FileAdmissionsBoard';
import { DossierFileRegistrationTseModal } from 'apps/cash-market/src/components/ListingModals/FileRegistrationTse';
import { DossierFileInsertionConfirmationLetterMarketUnitModal } from 'apps/cash-market/src/components/ListingModals/FileInsertionConfirmationLetterMarketUnit';
import { DossierFileIntroductionSessionModal } from 'apps/cash-market/src/components/ListingModals/FileIntroductionSession';
import { DossierFileCodeAndSymbolMeetingModal } from 'apps/cash-market/src/components/ListingModals/FileCodeAndSymbolMeeting';
import { DossierFileQuestionAnswerSessionModal } from 'apps/cash-market/src/components/ListingModals/FileQuestionAnswerSession';
import { ListingChangeStatusModal } from 'apps/cash-market/src/components/molecules/ListingChangeStatusModal';

const initialState = {
  menuListData: [],
  selectedMenu: {
    menuId: 1,
  },
  subMenuListData: [],
  logoFile: {},
  DateComponent: false,
  PercentComponent: false,
  NumericComponent: false,
  DossierTextComponent: false,
  DossierSimpleSelectComponent: false,
  DossierTextAreaComponent: false,
  data: null,
  selectedFilter: {
    id: '',
  },
  FileComponent: false,
  FiscalYearComponent: false,
  DateTextAreaComponent: false,
  KnowledgeBasedComponent: false,
  DossierShareholderComponent: false,
  TreeSelectComponent: false,
  submenuRow: '',
  FileDateComponent: false,
  FileListComponent: false,
  FileTextComponent: false,
  FileTextareaComponent: false,
  ReceiptAdmissionComponent: false,
  GeneralMeetingComponent: false,
  InsiderInformationComponent: false,
  ModificationAssociationComponent: false,
  ValueAddedTaxComponent: false,
  BusinessLicenseComponent: false,
  StockCertificateComponent: false,
  AllLegalProceedingComponent: false,
  MajorAssetComponent: false,
  OtherAcceptanceComponent: false,
  ManagementLetterAuditorComponent: false,
  InquiryApplicantCompanyComponent: false,
  RegisterationWithSEOComponent: false,
  AdmissionCommitteeNotificationComponent: false,
  SymbolAndCodeResolutionComponent: false,
  changeStatusModalState: false,
  QuestionAnswerSessionComponent: false,
  ApprovalLetterToMarketOperationComponent: false,
  IntroductorySessionComponent: false,
};
const ListingStockProcesses = ({ onAlert }: any) => {
  const filterItems = [
    {
      title: 'همه موارد',
      color: 'black',
      id: '',
    },
    {
      title: 'بررسی نشده',
      color: 'listingNotChecked',
      id: 'NotChecked',
    },
    {
      title: 'تایید',
      color: 'dossierModalTableConfirmButton',
      id: 'Confirm',
    },
    {
      title: 'نیاز به اصلاح',
      color: 'listingModalRejectButton',
      id: 'Reject',
    },
    {
      title: 'فاقد موضوعیت',
      color: 'listingIrrelevantButton',
      id: 'Irrelevant',
    },
    {
      title: 'بدون محتوا',
      color: 'listingNoContent',
      id: 'NotContent',
    },
  ];
  const [state, setState] = useStates<any>(initialState);
  const {
    logoFile,
    menuListData,
    selectedMenu,
    subMenuListData,
    DateComponent,
    PercentComponent,
    NumericComponent,
    DossierTextComponent,
    DossierTextAreaComponent,
    SelectComponent,
    data,
    selectedFilter,
    FileComponent,
    FiscalYearComponent,
    DateTextAreaComponent,
    KnowledgeBasedComponent,
    DossierShareholderComponent,
    TreeSelectComponent,
    submenuRow,
    FileDateComponent,
    FileListComponent,
    FileTextComponent,
    FileTextareaComponent,
    ReceiptAdmissionComponent,
    GeneralMeetingComponent,
    InsiderInformationComponent,
    ModificationAssociationComponent,
    ValueAddedTaxComponent,
    BusinessLicenseComponent,
    StockCertificateComponent,
    AllLegalProceedingComponent,
    MajorAssetComponent,
    OtherAcceptanceComponent,
    ManagementLetterAuditorComponent,
    InquiryApplicantCompanyComponent,
    RegisterationWithSEOComponent,
    AdmissionCommitteeNotificationComponent,
    SymbolAndCodeResolutionComponent,
    changeStatusModalState,
    QuestionAnswerSessionComponent,
    ApprovalLetterToMarketOperationComponent,
    IntroductorySessionComponent,
  } = state;
  const [searchParams] = useSearchParams();

  const DossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;
  const onFail = (error: any) => {
    onAlert(error);
  };

  useEffect(() => {
    handleGetMenu();
    handleGetSubMenu(1, DossierId, '');
  }, []);
  useEffect(() => {
    handleGetSubMenu(selectedMenu?.menuId, DossierId, '', submenuRow);
  }, [submenuRow]);
  const handleGetMenu = () => {
    const data = {
      DossierId,
      ListingTypeId: 'ListingAcceptance',
    };
    getMenus({
      data,
      onSuccess: (res: any) => setState({ menuListData: res }),
      onFail,
    });
  };
  const handleGetSubMenu = (
    MenuId: number,
    DossierId: any,
    DossierStateType: string,
    SubmenuRow?: any
  ) => {
    const rawData = {
      MenuId,
      DossierId,
      DossierStateType,
      SubmenuRow,
    };
    const data = Object.fromEntries(
      Object.entries(rawData).filter(
        ([key, value]) => value !== '' && value !== null
      )
    );
    getSubMenus({
      data,
      onSuccess: (res: any) => setState({ subMenuListData: res }),
      onFail,
    });
  };

  const onClickMenu = (item: any) => {
    setState({ selectedMenu: item, submenuRow: '' });
    handleGetSubMenu(item?.menuId, DossierId, '');
  };
  const onClickSubMenu = (data: any) => {
    setState({
      [`${data?.componentName}`]: true,
      data: data,
    });
  };
  const onClickFilter = (item: any) => {
    handleGetSubMenu(selectedMenu?.menuId, DossierId, item?.id);
    setState({ selectedFilter: item, submenuRow: '' });
  };
  const onChangeState = (key: string, value: string) => {
    setState({
      [key]: value,
    });
  };

  const handleGetParentApi = (selectedMenu: any) => {
    handleGetSubMenu(selectedMenu?.menuId, DossierId, '');
    setState({ selectedMenu: selectedMenu });
  };
  const onCloseChangeStatusModal = () => {
    setState({ changeStatusModalState: false });
    handleGetMenu();
  };
  return (
    <>
      <div className="relative">
        <Navbar nameLogo={AdminPanel} />
        <a
          className="absolute left-6 top-[45%] text-blue items-center flex"
          href="listing-stock/acceptance-dossieres"
        >
          <span>بازگشت به پرونده‌ها</span>
          <Icon
            name="icon-left-open"
            classname="text-listingNoContent text-2xl cursor-pointer pt-1"
          />
        </a>
      </div>
      <div className="col-span-12 grid grid-cols-12 overflow-hidden">
        <div className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-4 h-screen bg-listingTertiaryColor mt-6 mx-2 p-2 shadow-lg rounded-tl-3xl rounded-bl-3xl border border-grayBorder">
          <div className="border border-white rounded-xl m-4 flex flex-row  items-center p-1 max-w-fit">
            <div
              style={{
                backgroundColor: menuListData?.company?.dossierLevelTypeColor,
              }}
              className={`w-3 h-3 rounded-full  ml-2`}
            />
            <span
              style={{ color: menuListData?.company?.dossierLevelTypeColor }}
              className="font-bold pl-4"
            >
              {menuListData?.company?.dossierLevelTypeName}
            </span>
          </div>
          <div className="flex flex-row items-center justify-start m-4 pb-5 mt-8">
            <div className="w-[70px] h-[70px] rounded-full ml-4">
              <Image
                src={
                  menuListData?.company?.attachment?.link == undefined ||
                  menuListData?.company?.attachment?.link == ''
                    ? emptyPicture
                    : menuListData?.company?.attachment?.link
                }
                className="w-full h-full rounded-full min-w-[70px] min-h-[70px]  "
              />
            </div>
            <span className="font-bold text-white">
              {menuListData?.company?.companyName}
            </span>
          </div>
          {menuListData?.menus?.length > 0 &&
            menuListData?.menus?.map((item: any) => {
              return (
                <div className="flex justify-center mt-5">
                  <a
                    onClick={() => onClickMenu(item)}
                    className={`w-[90%] h-[60px] flex flex-col ${
                      selectedMenu?.menuId == item?.menuId
                        ? 'bg-listingSecondaryColor '
                        : 'bg-white'
                    } hover:bg-listingSecondaryColor justify-between p-1 items-start px-2 rounded-lg shadow-lg 
                    transition-all duration-600 
                    hover:scale-[1.03] hover:shadow-2xl`}
                  >
                    <span className="text-black font-bold">
                      {item?.menuTitle}
                    </span>
                    <div className="w-full flex pl-3">
                      <LinearProgress
                        percent={item?.progress}
                        className={`custom-progress ltr-progress progress-medium-size `}
                        withCustomColor
                      />
                    </div>
                  </a>
                </div>
              );
            })}
          <div className="flex justify-center mt-16 border-white border-t">
            <a
              onClick={() => setState({ changeStatusModalState: true })}
              className={`w-[50%] h-[50px] flex flex-row mt-8 bg-white
                     hover:bg-listingSecondaryColor justify-center p-1 items-center px-2 rounded-lg shadow-lg 
                    transition-all duration-600 
                    hover:scale-[1.03] hover:shadow-2xl`}
            >
              <Icon
                name="icon-progress-4"
                classname="text-black text-lg cursor-pointer pt-1"
              />
              <span className="text-black font-bold">وضعیت پرونده</span>
            </a>
          </div>
        </div>
        <div className="2xl:col-span-10 xl:col-span-9 lg:col-span-8 md:col-span-8 grid-cols-12  m-6 p-4 shadow-lg bg-listingBackgroundColor border border-grayBorder rounded-tr-3xl rounded-br-3xl ">
          <div className="col-span-12 grid grid-cols-12  items-center">
            <div className="2xl:col-span-11 xl:col-span-10 lg:col-span-12 md:col-span-12 mt-2 flex flex-row">
              {filterItems?.map((item: any) => {
                return (
                  <a
                    onClick={() => onClickFilter(item)}
                    className="mx-4 flex flex-row h-[30px]"
                  >
                    <div
                      className={`w-5 h-5 bg-${item?.color} ml-1 rounded-md`}
                    />
                    <span
                      className={`${
                        selectedFilter?.id == item?.id
                          ? `text-${item?.color}`
                          : 'text-darkGray'
                      } hover:text-listingTertiaryColor font-bold`}
                    >
                      {item?.title}
                    </span>
                  </a>
                );
              })}
            </div>
            <TextField
              label="شماره ردیف"
              className=" 2xl:col-span-1 xl:col-span-2 lg:col-span-3 md:col-span-3"
              value={deSeparator(submenuRow)}
              onChange={(value: any) =>
                setState({
                  submenuRow: value,
                })
              }
              maxLength={3}
            />
          </div>
          <div className="mt-12">
            {subMenuListData?.submenus?.length > 0 &&
              subMenuListData?.submenus?.map((item: any) => {
                return (
                  <div
                    className="flex flex-row  h-[85px] my-4  bg-white rounded-2xl  transition-all duration-600 
                 hover:scale-[1.01] hover:shadow-xl hover:cursor-pointer "
                    onClick={() => onClickSubMenu(item)}
                  >
                    <div
                      className={`w-3 h-full rounded-tr-2xl rounded-br-2xl bg-${
                        filterItems?.find(
                          (filter: any) =>
                            filter?.id ==
                            item?.dossierData?.dossierStateTypes?.[0]
                              ?.dossierStateTypeId
                        )?.color
                      }
                        `}
                    ></div>
                    <div className="flex w-full p-2 flex-col justify-between">
                      <div className="flex items-center justify-start">
                        <span className="font-bold ml-2">
                          {item?.submenuRow} -
                        </span>
                        <span className="font-bold ">{item?.submenuTitle}</span>
                      </div>
                      <div className="col-span-12 flex bg-grayBorder h-[1px]" />
                      <div className="col-span-12 flex flex-row items-center justify-between">
                        <div className="col-span-4 flex justify-end items-center">
                          <span className=" text-li rounded  text-listingNotChecked ">
                            {item?.lastValue}
                          </span>
                        </div>
                        {item?.dossierData?.dossierStateTypes?.map(
                          (dossierStateItem: any, index: number) => {
                            const matchedFilter = filterItems?.find(
                              (filter) =>
                                filter.id ===
                                dossierStateItem.dossierStateTypeId
                            );

                            return (
                              <div key={index} className="mx-1">
                                <span
                                  className={`text-${matchedFilter?.color}`}
                                >
                                  ({dossierStateItem.dossierStateTypeName})
                                </span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
      <DossierDateModal
        isOpen={DateComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierPercentModal
        isOpen={PercentComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierNumberModal
        isOpen={NumericComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierTextFieldModal
        isOpen={DossierTextComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierSimpleSelectModal
        isOpen={SelectComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierTextAreaModal
        isOpen={DossierTextAreaComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierFileModal
        isOpen={FileComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierFiscalYearModal
        isOpen={FiscalYearComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierKnowledgeBasedModal
        isOpen={KnowledgeBasedComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierDateTextAreaModal
        isOpen={DateTextAreaComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierShareHolderModal
        isOpen={DossierShareholderComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierTreeSelectModal
        isOpen={TreeSelectComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierFileDateModal
        isOpen={FileDateComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierFileTextModal
        isOpen={FileTextComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierFileListModal
        isOpen={FileListComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierFileTextAreaModal
        isOpen={FileTextareaComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierFilePaymentReceiptModal
        isOpen={ReceiptAdmissionComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierFileLast2YearChangeModal
        isOpen={ModificationAssociationComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierFileGeneralMeetingsMinutesModal
        isOpen={GeneralMeetingComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierFileCompanyInsidersDetailsModal
        isOpen={InsiderInformationComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierValueAddedTaxModal
        isOpen={ValueAddedTaxComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierFileActivityPermitModal
        isOpen={BusinessLicenseComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierCompanyStockCertificateImageModal
        isOpen={StockCertificateComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierFileAllPendingLawsuitsModal
        isOpen={AllLegalProceedingComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierFileAuditorLetterModal
        isOpen={ManagementLetterAuditorComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierFileMajorAssetsAndOwnershipDocumentsModal
        isOpen={MajorAssetComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierFileOtherDocumentsModal
        isOpen={OtherAcceptanceComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierFileInquiryApplicantCompanyModal
        isOpen={InquiryApplicantCompanyComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierFileAdmissionsBoardModal
        isOpen={AdmissionCommitteeNotificationComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierFileRegistrationTseModal
        isOpen={RegisterationWithSEOComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierFileInsertionConfirmationLetterMarketUnitModal
        isOpen={ApprovalLetterToMarketOperationComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierFileIntroductionSessionModal
        isOpen={IntroductorySessionComponent}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierFileCodeAndSymbolMeetingModal
        isOpen={SymbolAndCodeResolutionComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      <DossierFileQuestionAnswerSessionModal
        isOpen={QuestionAnswerSessionComponent}
        modalData={data}
        onChangeState={onChangeState}
        handleGetParentApi={handleGetParentApi}
        onAlert={onAlert}
      />
      {/* //////////////////////////////change status/////////////////// */}
      <ListingChangeStatusModal
        isOpen={changeStatusModalState}
        onAlert={onAlert}
        onCloseModal={onCloseChangeStatusModal}
      />
    </>
  );
};
export default withAlert(ListingStockProcesses);
