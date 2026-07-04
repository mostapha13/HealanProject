import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import { Table } from '@tse/components/organism';
import { Button, AntdSelectSearch } from '@tse/components/atoms';
import { HeaderTypes } from '@tse/types';
import {
  modalFindApi,
  modalSaveApi,
  modalConfirmApi,
  modalRejectApi,
} from 'apps/cash-market/src/Controller/Listing/Modal';
import { Icon, TextField } from '@tse/components/atoms';
import { ListingModalComponent } from 'apps/cash-market/src/components/atoms/ListingModalComponent';

export function DossierShareHolderModal(props: any) {
  const { isOpen, modalData, onChangeState, onAlert, handleGetParentApi } =
    props;

  const initialState = {
    shareholderNameAmount: '',
    shareholderPercentAmount: '',
    shareholderNameAmountError: false,
    shareholderPercentAmountError: false,
    ListData: [],
    isShowChat: false,
  };

  const [state, setState] = useStates<any>(initialState);
  const {
    shareholderPercentAmount,
    shareholderNameAmount,
    shareholderNameAmountError,
    shareholderPercentAmountError,
    ListData,
    isShowChat,
  } = state;
  const [searchParams] = useSearchParams();
  const dossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;

  useEffect(() => {
    if (modalData != null && isOpen) {
      handleGetList();
    }
  }, [modalData]);

  const onAcceptDossierTable = (id: any) => {
    handleConfirmRecord(id);
  };

  const onRejectDossierTable = (id: any) => {
    handleRejectRecord(id);
  };

  const handleConfirmRecord = (id: any) => {
    const data = { dossierDataShareholderId: id };

    modalConfirmApi({
      data,
      url: modalData?.confirmApiName,
      onSuccess: (res: any) => handleGetList(),
      onFail,
    });
  };

  const handleRejectRecord = (id: any) => {
    const data = { dossierDataShareholderId: id };
    modalRejectApi({
      data,
      url: modalData?.rejectApiName,
      onSuccess: (res: any) => handleGetList(),
      onFail,
    });
  };

  const licenseTableHeader: HeaderTypes[] = [
    {
      title: modalData?.submenuTitle,
      dataIndex: 'shareholderNameAmount',
      key: 'shareholderNameAmount',
      className: `${
        ListData?.accessAction ? 'col-span-3' : 'col-span-6'
      }`,
    },
    {
      title: 'اعمال وضعیت',
      dataIndex: 'action',
      key: 'action',
      className: 'col-span-5 !justify-center',
      render: (_: any, item: any) => {
        return (
          <div className="flex flex-row items-center flitems-center justify-center">
            <Button
              className="w-16 h-7 bg-dossierModalTableConfirmButton text-white ml-2"
              onClick={() =>
                onAcceptDossierTable(item?.dossierDataShareholderId)
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
                onRejectDossierTable(item?.dossierDataShareholderId)
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
    //   className: 'col-span-3',
    // },
  ];

    const filteredColumn = ListData?.accessAction
    ? licenseTableHeader
    : licenseTableHeader?.filter((column: any) => column?.key != 'action');

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSuccessAddRow = () => {
    setState({ shareholderNameAmount: '', shareholderPercentAmount: '' });
    handleGetList();
  };

  const onAddRow = () => {
    if (shareholderPercentAmount && shareholderNameAmount) {
      const data = {
        dossierId,
        submenuId: modalData?.submenuId,
        shareholderNameAmount: shareholderNameAmount,
        shareholderPercentAmount: shareholderPercentAmount,
      };
      modalSaveApi({
        url: modalData?.saveApiName,
        data,
        onSuccess: (res: any) => onSuccessAddRow(),
        onFail,
      });
    } else {
      setState({
        shareholderPercentAmountError: true,
        shareholderNameAmountError: true,
      });
    }
  };

  const onSuccessGetList = (res: any) => {
    setState({ ListData: res });
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

  const onCloseModal = () => {
    onChangeState(modalData?.componentName, false);
    setState({
      shareholderNameAmount: '',
      shareholderPercentAmount: '',
      shareholderPercentAmountError: false,
      shareholderNameAmountError: false,
    });
  };

  const onSuccessSubmit = () => {
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
      listData={ListData}
      onSuccessSubmit={onSuccessSubmit}
      lastValue = {`${ListData?.dossierShareholderInfoResult?.[0]?.shareholderNameAmount} _ ${ListData?.dossierShareholderInfoResult?.[0]?.shareholderPercentAmount}`}
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
              <div className="bg-[#f0efef] rounded-full py-2 px-4 flex flex-row items-center">
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
        <div className="2xl:col-span-4 xl:col-span-4 lg:col-span-6 md:col-span-12 grid grid-cols-12 gap-x-4 lg:py-2 md:gap-y-1 lg:gap-y-1 my-10">
          <TextField
            label="درصد سهام قابل عرضه"
            className="2xl:col-span-6 xl:col-span-6 lg:col-span-12 md:col-span-12"
            value={shareholderPercentAmount}
            onChange={(value: any) => {
              setState({
                shareholderPercentAmount: value,
                dossierPercentError: '',
              });
            }}
            required
            type="number"
            max={100}
            errorMessage={shareholderPercentAmountError}
          />
          <TextField
            label={modalData?.submenuTitle}
            className="2xl:col-span-6 xl:col-span-6 lg:col-span-12 md:col-span-12"
            value={shareholderNameAmount}
            onChange={(value: any) =>
              setState({
                shareholderNameAmount: value,
                shareholderNameAmountError: false,
              })
            }
            required
            errorMessage={shareholderNameAmountError}
          />
        </div>

        <div className="2xl:col-span-8 xl:col-span-8 lg:col-span-6 md:col-span-12 items-center justify-start">
          <Button
            className="w-32 h-9 bg-listingModalRegisterButton text-white mx-4 md:mx-0 md:mt-2"
            onClick={onAddRow}
          >
            ثبت
          </Button>
        </div>
        <div className="col-span-12 mt-5">
          {}
          <Table
            columns={filteredColumn}
            className="col-span-12 grid grid-cols-12 "
            data={
              ListData?.dossierShareholderInfoResult?.length > 0
                ? ListData?.dossierShareholderInfoResult
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
export default withAlert(DossierShareHolderModal);
