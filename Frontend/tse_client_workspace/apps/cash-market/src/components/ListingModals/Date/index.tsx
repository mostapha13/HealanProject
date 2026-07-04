import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import { Table } from '@tse/components/organism';
import { Button } from '@tse/components/atoms';
import { HeaderTypes } from '@tse/types';
import { DatePicker } from '@tse/components/molecules';
import {
  findDossierDates,
  saveDossierDate,
  confirmDossierDate,
  rejectDossierDate,
} from 'apps/cash-market/src/Controller/Listing/Modal';
import { Icon } from '@tse/components/atoms';
import { convertDateToJalali } from '@tse/tools';
import { ListingModalComponent } from 'apps/cash-market/src/components/atoms/ListingModalComponent';

export function DossierDateModal(props: any) {
  const { isOpen, modalData, onChangeState, onAlert, handleGetParentApi } =
    props;

  const initialState = {
    dateAmount: '',
    dossierDatesList: '',
    dossierDateError: false,
    isShowChat: false,
  };

  const [state, setState] = useStates<any>(initialState);
  const { dateAmount, dossierDatesList, dossierDateError, isShowChat } = state;
  const [searchParams] = useSearchParams();
  const dossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;

  useEffect(() => {
    if (modalData != null && isOpen) {
      handleGateDossierDates();
    }
  }, [modalData]);

  const onAcceptDossierTable = (id: any) => {
    handleConfirmDossierDate(id);
  };

  const onRejectDossierTable = (id: any) => {
    handleRejectDossierDate(id);
  };

  const handleConfirmDossierDate = (id: any) => {
    const data = { dossierDataDateId: id };

    confirmDossierDate({
      data,
      url: modalData?.confirmApiName,
      onSuccess: (res: any) => handleGateDossierDates(),
      onFail,
    });
  };

  const handleRejectDossierDate = (id: any) => {
    const data = { dossierDataDateId: id };
    rejectDossierDate({
      data,
      url: modalData?.rejectApiName,
      onSuccess: (res: any) => handleGateDossierDates(),
      onFail,
    });
  };

  const licenseTableHeader: HeaderTypes[] = [
    {
      title: modalData?.submenuTitle,
      dataIndex: 'dateAmount',
      key: 'dateAmount',
      className: `${
        dossierDatesList?.accessAction ? 'col-span-4' : 'col-span-6'
      }`,
      render: (_: any, item: any) => convertDateToJalali(item?.dateAmount),
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
              onClick={() => onAcceptDossierTable(item?.dossierDataDateId)}
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
              onClick={() => onRejectDossierTable(item?.dossierDataDateId)}
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
        dossierDatesList?.accessAction ? 'col-span-3' : 'col-span-5'
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
    //   className: 'col-span-3',
    // },
  ];

  const filteredColumn = dossierDatesList?.accessAction
    ? licenseTableHeader
    : licenseTableHeader?.filter((column: any) => column?.key != 'action');

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onChangeDate = (value: any) => {
    setState({ dateAmount: value, dossierDateError: false });
  };
  const onSuccessSaveDate = () => {
    setState({ dateAmount: '' });
    handleGateDossierDates();
  };

  const onAddDate = () => {
    const data = { dossierId, submenuId: modalData?.submenuId, dateAmount };
    if (dateAmount) {
      saveDossierDate({
        url: modalData?.saveApiName,
        data,
        onSuccess: (res: any) => onSuccessSaveDate(),
        onFail,
      });
    } else {
      setState({ dossierDateError: true });
    }
  };
  const onSuccessGetDate = (res: any) => {
    setState({ dossierDatesList: res });
  };

  const handleGateDossierDates = () => {
    const dataQuery = { dossierId, submenuId: modalData?.submenuId };
    findDossierDates({
      url: modalData?.findApiName,
      data: dataQuery,
      onSuccess: (res: any) => onSuccessGetDate(res),
      onFail,
    });
  };

  const onCloseModal = () => {
    onChangeState(modalData?.componentName, false);
    setState({ dateAmount: '', dossierDateError: false });
  };

  const onSuccessSubmit = () => {
    setState({ dateAmount: '' });
    handleGetParentApi(modalData);
    onCloseModal();
  };

  return (
    <ListingModalComponent
      onAlert={onAlert}
      isOpen={isOpen}
      data={modalData}
      onCloseModal={onCloseModal}
      isShowChat={isShowChat}
      listData={dossierDatesList}
      onSuccessSubmit={onSuccessSubmit}
      lastValue={convertDateToJalali(
        dossierDatesList?.dossierDateInfoResult?.[0]?.dateAmount
      )}
    >
      <div
        className={` ${
          isShowChat
            ? '2xl:col-span-8  xl:col-span-8 lg:col-span-12 md:col-span-12'
            : 'col-span-12'
        } grid grid-cols-12  items-center justify-center bg-white rounded-2xl p-6 `}
      >
        <div className="flex col-span-12 justify-end px-2 items-center">
          {dossierDatesList?.dossierStateTypes?.map((item: any) => {
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
        <div className="2xl:col-span-4 xl:col-span-4 lg:col-span-6 md:col-span-12 items-center justify-center rounded-2xl my-10">
          <DatePicker
            //parentClassName="!w-[50%]"
            label={modalData?.submenuTitle}
            value={dateAmount}
            onChange={(value: any) => onChangeDate(value)}
            onClearDate={() => onChangeDate('')}
            required
            error={dossierDateError}
          />
        </div>

        <div className="2xl:col-span-8 xl:col-span-8 lg:col-span-6 md:col-span-12 items-center justify-start ">
          <Button
            className="w-32 h-9 bg-listingModalRegisterButton text-white m-4 md:m-0"
            onClick={onAddDate}
          >
            ثبت
          </Button>
        </div>
        <div className="col-span-12 mt-5">
          <Table
            columns={filteredColumn}
            className="col-span-12 grid grid-cols-12 "
            data={
              dossierDatesList?.dossierDateInfoResult?.length > 0
                ? dossierDatesList?.dossierDateInfoResult
                : []
            }
            // onChangePage={onChangeTablePage}
            totalPages={1}
            pageSize={100}
          />
        </div>
      </div>
    </ListingModalComponent>
  );
}
export default withAlert(DossierDateModal);
