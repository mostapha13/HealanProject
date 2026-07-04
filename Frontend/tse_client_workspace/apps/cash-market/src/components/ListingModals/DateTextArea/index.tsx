import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import { Modal, Popconfirm, Radio } from 'antd';
import { Table } from '@tse/components/organism';
import { AntdTextArea, Button, Upload } from '@tse/components/atoms';
import { HeaderTypes } from '@tse/types';
import {
  confirmGeneralDossierModal,
  irrevelenteGeneralDossierModal,
  modalFindApi,
  modalSaveApi,
  modalConfirmApi,
  modalRejectApi,
} from 'apps/cash-market/src/Controller/Listing/Modal';
import { Icon } from '@tse/components/atoms';
import { DatePicker } from '@tse/components/molecules';
import { convertDateToJalali } from '@tse/tools';
import { ListingModalComponent } from 'apps/cash-market/src/components/atoms/ListingModalComponent';

export function DossierDateTextAreaModal(props: any) {
  const { isOpen, modalData, onChangeState, onAlert, handleGetParentApi } =
    props;

  const initialState = {
    dateValue: '',
    dateError: false,
    textAreaValue: '',
    textAreaError: false,
    ListData: [],
    isShowChat: false,
  };

  const [state, setState] = useStates<any>(initialState);
  const { dateValue, ListData, textAreaValue, isShowChat } = state;
  const [searchParams] = useSearchParams();
  const dossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;
  const listTableHeader: HeaderTypes[] = [
    {
      title: 'تاریخ آخرین مهلت',
      dataIndex: 'date',
      key: 'date',
      className: 'col-span-2',
      render: (item: string) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: modalData?.submenuTitle,
      dataIndex: 'title',
      key: 'title',
      className: `${
        ListData?.accessAction ? 'col-span-4' : 'col-span-5'
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
              onClick={() => onAcceptTable(item?.dossierDataDateTextAreaId)}
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
              onClick={() => onRejectTable(item?.dossierDataDateTextAreaId)}
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
        ListData?.accessAction ? 'col-span-1' : 'col-span-4'
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
  useEffect(() => {
    if (modalData != null && isOpen) {
      handleGetList();
    }
  }, [modalData]);

  const filteredColumn = ListData?.accessAction
  ? listTableHeader
  : listTableHeader?.filter((column: any) => column?.key != 'action');

  const onFail = (error: any) => {
    onAlert(error);
  };

  const handleGetList = () => {
    const dataQuery = { dossierId, submenuId: modalData?.submenuId };
    modalFindApi({
      url: modalData?.findApiName,
      data: dataQuery,
      onSuccess: (res: any) => onSuccessGetList(res),
      onFail,
    });
  };
  const onSuccessGetList = (res: any) => {
    setState({ ListData: res });
  };

  const onSaveClick = () => {
    if (dateValue) {
      const data = {
        dossierId,
        submenuId: modalData?.submenuId,
        date: dateValue,
        title: textAreaValue,
      };
      modalSaveApi({
        url: modalData?.saveApiName,
        data,
        onSuccess: (res: any) => onSuccessSave(),
        onFail,
      });
    } else {
      !dateValue && setErrorMessage('date');
    }
  };

  const onSuccessSave = () => {
    setState({ dateValue: '', textAreaValue: '' });
    handleGetList();
  };

  const onAcceptTable = (id: any) => {
    handleConfirm(id);
  };

  const onRejectTable = (id: any) => {
    handleReject(id);
  };

  const handleConfirm = (id: any) => {
    const data = { dossierDataDateTextAreaId: id };
    modalConfirmApi({
      data,
      url: modalData?.confirmApiName,
      onSuccess: (res: any) => handleGetList(),
      onFail,
    });
  };

  const handleReject = (id: any) => {
    const data = { dossierDataDateTextAreaId: id };
    modalRejectApi({
      data,
      url: modalData?.rejectApiName,
      onSuccess: (res: any) => handleGetList(),
      onFail,
    });
  };

  const onCloseModal = () => {
    setState({ fileUploadError: false, dateValue: '', textAreaValue: '' });
    onChangeState(modalData?.componentName, false);
  };

  const onSuccessSubmit = () => {
    setState({ fileUploadError: false, dateValue: '', textAreaValue: '' });
    handleGetParentApi(modalData);
    onCloseModal();
  };

  const setErrorMessage = (key: string) => {
    const errorMessage = true;
    setState({ [`${key}Error`]: errorMessage });
  };

  const onChangeDate = (value: any) => {
    setState({ dateValue: value, dateError: false });
  };
  const onChangeTextArea = (value: string) => {
    setState({ textAreaValue: value, textAreaError: false });
  };
  return (
    <ListingModalComponent
      onAlert={onAlert}
      isOpen={isOpen}
      data={modalData}
      onCloseModal={onCloseModal}
      isShowChat={isShowChat}
      listData={ListData}
      onSuccessSubmit={onSuccessSubmit}
      lastValue={ 
        convertDateToJalali(
          ListData?.dossierDateTextAreaInfoResult?.[0]?.date
      )
    }
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
        <div className=" col-span-5 items-center justify-center rounded-2xl my-8">
          <DatePicker
            // label={'تاریخ' + ' ' + modalData?.submenuTitle}
            label="تاریخ آخرین مهلت"
            value={dateValue}
            onChange={(value: any) => onChangeDate(value)}
            onClearDate={() => onChangeDate('')}
            required
            error={state?.dateError}
          />
        </div>
        <AntdTextArea
          className={'col-span-12 items-center justify-center rounded-lg'}
          placeholder={modalData?.submenuTitle}
          numberOfRows={4}
          onChange={onChangeTextArea}
          value={textAreaValue}
          error={state?.textAreaError}
        />
        <div className=" col-span-12 flex items-center justify-end ">
          <Button
            className="w-32 h-9  bg-listingModalRegisterButton text-white my-4"
            onClick={onSaveClick}
          >
            ثبت
          </Button>
        </div>
        <div className="col-span-12 mt-5">
          <Table
            columns={filteredColumn}
            className="col-span-12 grid grid-cols-12 "
            data={
              ListData?.dossierDateTextAreaInfoResult?.length > 0
                ? ListData?.dossierDateTextAreaInfoResult
                : []
            }
            totalPages={1}
            pageSize={100}
          />
        </div>
      </div>
    </ListingModalComponent>
  );
}
export default withAlert(DossierDateTextAreaModal);
