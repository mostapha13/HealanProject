import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { useStates, useEffect, useState, useSearchParams } from '@tse/utils';
import { Modal, Popconfirm, Radio } from 'antd';
import { Table } from '@tse/components/organism';
import { Button, AntdSelectSearch } from '@tse/components/atoms';
import { HeaderTypes } from '@tse/types';
import { Icon } from '@tse/components/atoms';
import {
  findDossierFiscalYears,
  saveDossierFiscalYear,
  confirmDossierFiscalYear,
  rejectDossierFiscalYear,
  confirmGeneralDossierModal,
  irrevelenteGeneralDossierModal,
} from 'apps/cash-market/src/Controller/Listing/Modal';
import { ListingModalComponent } from '../../atoms/ListingModalComponent';

export function DossierFiscalYearModal(props: any) {
  const { isOpen, modalData, onChangeState, onAlert, handleGetParentApi } =
    props;

  const initialState = {
    fiscalMonthAmount: '',
    fiscalDayAmount: '',
    selectedMonthAmount: '',
    selectedDayAmount: '',
    monthAmountError: false,
    dayAmountError: false,
    ListData: [],
    isShowChat: false,
  };

  const [state, setState] = useStates<any>(initialState);
  const {
    selectedMonthAmount,
    selectedDayAmount,
    monthAmountError,
    dayAmountError,
    ListData,
    isShowChat,
  } = state;
  const [searchParams] = useSearchParams();
  const dossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;

  useEffect(() => {
    if (modalData != null && isOpen) {
      handleGateDossierFiscalYears();
    }
  }, [modalData]);

  const months = [
    { id: '1', title: '1' },
    { id: '2', title: '2' },
    { id: '3', title: '3' },
    { id: '4', title: '4' },
    { id: '5', title: '5' },
    { id: '6', title: '6' },
    { id: '7', title: '7' },
    { id: '8', title: '8' },
    { id: '9', title: '9' },
    { id: '10', title: '10' },
    { id: '11', title: '11' },
    { id: '12', title: '12' },
  ];

  const days = [
    { id: '1', title: '1' },
    { id: '2', title: '2' },
    { id: '3', title: '3' },
    { id: '4', title: '4' },
    { id: '5', title: '5' },
    { id: '6', title: '6' },
    { id: '7', title: '7' },
    { id: '8', title: '8' },
    { id: '9', title: '9' },
    { id: '10', title: '10' },
    { id: '11', title: '11' },
    { id: '12', title: '12' },
    { id: '13', title: '13' },
    { id: '14', title: '14' },
    { id: '15', title: '15' },
    { id: '16', title: '16' },
    { id: '17', title: '17' },
    { id: '18', title: '18' },
    { id: '19', title: '19' },
    { id: '20', title: '20' },
    { id: '21', title: '21' },
    { id: '22', title: '22' },
    { id: '23', title: '23' },
    { id: '24', title: '24' },
    { id: '25', title: '25' },
    { id: '26', title: '26' },
    { id: '27', title: '27' },
    { id: '28', title: '28' },
    { id: '29', title: '29' },
    { id: '30', title: '30' },
    { id: '31', title: '31' },
  ];

  const onAcceptDossierTable = (id: any) => {
    handleConfirmDossierFiscalYear(id);
  };

  const onRejectDossierTable = (id: any) => {
    handleRejectDossierFiscalYear(id);
  };

  const handleConfirmDossierFiscalYear = (id: any) => {
    const data = { dossierDataFiscalYearId: id };
    confirmDossierFiscalYear({
      data,
      url: modalData?.confirmApiName,
      onSuccess: (res: any) => handleGateDossierFiscalYears(),
      onFail,
    });
  };

  const handleRejectDossierFiscalYear = (id: any) => {
    const data = { dossierDataFiscalYearId: id };
    rejectDossierFiscalYear({
      data,
      url: modalData?.rejectApiName,
      onSuccess: (res: any) => handleGateDossierFiscalYears(),
      onFail,
    });
  };

  const licenseTableHeader: HeaderTypes[] = [
    {
      title: 'روز',
      dataIndex: 'fiscalDayAmount',
      key: 'fiscalDayAmount',
      className: `${
        ListData?.accessAction ? 'col-span-2' : 'col-span-3'
      }`,
    },  
    {
      title: 'ماه',
      dataIndex: 'fiscalMonthAmount',
      key: 'fiscalMonthAmount',
      className: `${
        ListData?.accessAction ? 'col-span-2' : 'col-span-3'
      }`,
    },
    {
      title: 'اعمال وضعیت',
      dataIndex: 'action',
      key: 'action',
      className: 'col-span-4 !justify-center',
      render: (_: any, item: any) => {
        return (
          <div className="flex flex-row items-center flitems-center justify-center">
            <Button
              className="w-16 h-7  bg-dossierModalTableConfirmButton text-white ml-2"
              onClick={() =>
                onAcceptDossierTable(item?.dossierDataFiscalYearId)
              }
              disabled={item?.dossierStateTypeId != 'NotChecked'}
            >
              <Icon
                name="icon-ok"
                classname="text-white text-base cursor-pointer pt-1"
              />
              تایید
            </Button>
            <Button
              className="h-7 bg-dossierModalTableRejectButton text-white p-2"
              onClick={() =>
                onRejectDossierTable(item?.dossierDataFiscalYearId)
              }
              disabled={item?.dossierStateTypeId != 'NotChecked'}
            >
              <Icon
                name="icon-cancel"
                classname="text-white text-lg cursor-pointer pt-1"
              />
              نیاز به اصلاح
            </Button>
          </div>
        );
      },
    },
    {
      title: 'وضعیت',
      dataIndex: 'dossierStateTypeId',
      key: 'dossierStateTypeId',
      className: `${
        ListData?.accessAction ? 'col-span-3' : 'col-span-5'
      }`,
      render: (_: any, item: any) => {
        return item?.dossierStateTypeId == 'Confirm' ? (
          <Icon
            name="icon-ok-circle"
            classname="text-dossierModalTableConfirmButton text-lg cursor-pointer"
          />
        ) : item?.dossierStateTypeId == 'Reject' ? (
          <Icon
            name="icon-cancel-circle"
            classname="text-dossierModalTableRejectButton text-lg cursor-pointer"
          />
        ) : (
          <Icon
            name="icon-details"
            classname="text-gray text-lg cursor-pointer"
          />
        );
      },
    },
    // {
    //   title: 'توضیحات',
    //   dataIndex: 'description',
    //   key: 'description',
    //   className: 'col-span-2',
    // },
  ];

  const filteredColumn = ListData?.accessAction
  ? licenseTableHeader
  : licenseTableHeader?.filter((column: any) => column?.key != 'action');

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSuccessSaveFiscalYear = () => {
    setState({ selectedMonthAmount: '', selectedDayAmount: '' });
    handleGateDossierFiscalYears();
  };

  const onAddFiscalYear = () => {
    const data = {
      dossierId,
      submenuId: modalData?.submenuId,
      fiscalMonthAmount: selectedMonthAmount?.title,
      fiscalDayAmount: selectedDayAmount?.title,
    };
    if (selectedMonthAmount && selectedDayAmount) {
      saveDossierFiscalYear({
        url: modalData?.saveApiName,
        data,
        onSuccess: (res: any) => onSuccessSaveFiscalYear(),
        onFail,
      });
    } else {
      setState({ monthAmountError: true, dayAmountError: true });
    }
  };

  const onSuccessGetFiscalYear = (res: any) => {
    setState({ ListData: res });
  };

  const handleGateDossierFiscalYears = () => {
    const dataQuery = { dossierId, submenuId: modalData?.submenuId };
    findDossierFiscalYears({
      url: modalData?.findApiName,
      data: dataQuery,
      onSuccess: (res: any) => onSuccessGetFiscalYear(res),
      onFail,
    });
  };

  const onCloseModal = () => {
    onChangeState(modalData?.componentName, false);
    setState({
      selectedMonthAmount: '',
      selectedDayAmount: '',
      monthAmountError: false,
      dayAmountError: false,
    });
  };

  const onSuccessSubmit = () => {
    handleGetParentApi(modalData);
    onCloseModal();
  };

  const handleGetSelectData = (filterText: any) => {};

  return (
    <ListingModalComponent
      onAlert={onAlert}
      isOpen={isOpen}
      data={modalData}
      onCloseModal={onCloseModal}
      isShowChat={isShowChat}
      listData={ListData}
      onSuccessSubmit={onSuccessSubmit}
      lastValue={ `روز ${ListData?.dossierFiscalYearInfoResult?.[0]?.fiscalMonthAmount} _ ماه ${ListData?.dossierFiscalYearInfoResult?.[0]?.fiscalDayAmount} `}
    >
      <div
        className={` ${
          isShowChat
            ? '2xl:col-span-8  xl:col-span-8 lg:col-span-12 md:col-span-12'
            : 'col-span-12'
        } grid grid-cols-12  items-center justify-center bg-white rounded-2xl p-6 `}
      >
        <div className="flex col-span-12 justify-end px-2 items-center">
          {ListData?.dossierStateTypes?.map((item: any) => {
            return (
              <div className="bg-[#f0efef] rounded-full py-2 px-4 flex flex-row  items-center">
                <div className="rounded-full w-[0.45rem] h-[0.45rem] border-gray bg-gray" />
                <span className="px-1">{item?.dossierStateTypeName}</span>
              </div>
            );
          })}
          <Icon
            name="icon-chat"
            classname=" text-lg cursor-pointer px-2"
            onClick={() => setState({ isShowChat: !isShowChat })}
          />
        </div>
        {/* <div className="2xl:col-span-10  xl:col-span-10 lg:col-span-10 grid grid-cols-12  items-center justify-center bg-white rounded-2xl p-6"> */}
        <div className="col-span-5 grid grid-cols-12 gap-4">
          <AntdSelectSearch
            label="روز مالی"
            className="2xl:col-span-6 xl:col-span-6 lg:col-span-12 md:col-span-12"
            data={days}
            onChange={(value: any) => {
              if (value?.title != undefined) {
                setState({
                  selectedDayAmount: value,
                  dayAmountError: false,
                });
              } else if (value == '') {
                setState({
                  selectedDayAmount: null,
                  dayAmountError: false,
                });
              }
            }}
            onSearch={(value: any) => handleGetSelectData(value)}
            showKey="title"
            idKey="id"
            value={selectedDayAmount}
            error={dayAmountError}
          />
          <AntdSelectSearch
            label="ماه مالی"
            className="2xl:col-span-6 xl:col-span-6 lg:col-span-12 md:col-span-12"
            data={months}
            onChange={(value: any) => {
              if (value?.title != undefined) {
                setState({
                  selectedMonthAmount: value,
                  monthAmountError: false,
                });
              } else if (value == '') {
                setState({
                  selectedMonthAmount: null,
                  monthAmountError: false,
                });
              }
            }}
            onSearch={(value: any) => handleGetSelectData(value)}
            showKey="title"
            idKey="id"
            value={selectedMonthAmount}
            error={monthAmountError}
          />
        </div>
        <div className="2xl:col-span-5 xl:col-span-5 lg:col-span-12 md:col-span-12 items-center justify-start">
          <Button
            className="w-32 h-9  bg-listingModalRegisterButton text-white m-4 lg:mx-0 md:mx-0"
            onClick={onAddFiscalYear}
          >
            ثبت
          </Button>
        </div>

        <div className="col-span-12 mt-5">
          <Table
            columns={filteredColumn}
            className="col-span-12 grid grid-cols-12 "
            data={
              ListData?.dossierFiscalYearInfoResult?.length > 0
                ? ListData?.dossierFiscalYearInfoResult
                : []
            }
            // onChangePage={onChangeTablePage}
            totalPages={1}
            pageSize={100}
          />
        </div>
        {/* </div> */}
      </div>
    </ListingModalComponent>
  );
}
export default withAlert(DossierFiscalYearModal);
