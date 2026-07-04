import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useSearchParams,
} from '@tse/utils';
import { Table } from '@tse/components/organism';
import { Button, TextField } from '@tse/components/atoms';
import { HeaderTypes } from '@tse/types';
import {
  findDossierDPercent,
  saveDossierPercent,
  confirmDossierPercent,
  rejectDossierPercent,
} from 'apps/cash-market/src/Controller/Listing/Modal';
import { Icon } from '@tse/components/atoms';
import { ListingModalComponent } from 'apps/cash-market/src/components/atoms/ListingModalComponent';

export function DossierPercentModal(props: any) {
  const { isOpen, modalData, onChangeState, onAlert, handleGetParentApi } =
    props;

  const initialState = {
    percentAmount: '',
    dossierPercentError: false,
    ListData: [],
    isShowChat: false,
  };

  const [state, setState] = useStates<any>(initialState);
  const { percentAmount, dossierPercentError, ListData, isShowChat } = state;
  const [searchParams] = useSearchParams();
  const dossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;

  useEffect(() => {
    if (modalData != null && isOpen) {
      handleGateDossierPercents();
    }
  }, [modalData]);

  const onAcceptDossierTable = (id: any) => {
    handleConfirmDossierPercent(id);
  };

  const onRejectDossierTable = (id: any) => {
    handleRejectDossierPercent(id);
  };

  const handleConfirmDossierPercent = (id: any) => {
    const data = { dossierDataPercentId: id };

    confirmDossierPercent({
      data,
      url: modalData?.confirmApiName,
      onSuccess: (res: any) => handleGateDossierPercents(),
      onFail,
    });
  };

  const handleRejectDossierPercent = (id: any) => {
    const data = { dossierDataPercentId: id };
    rejectDossierPercent({
      data,
      url: modalData?.rejectApiName,
      onSuccess: (res: any) => handleGateDossierPercents(),
      onFail,
    });
  };

  const licenseTableHeader: HeaderTypes[] = [
    {
      title: modalData?.submenuTitle,
      dataIndex: 'percentAmount',
      key: 'percentAmount',
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
              onClick={() => onAcceptDossierTable(item?.dossierDataPercentId)}
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
              onClick={() => onRejectDossierTable(item?.dossierDataPercentId)}
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
        ListData?.accessAction ? 'col-span-3' : 'col-span-6'
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

  const onSuccessSavePercent = () => {
    setState({ percentAmount: '' });
    handleGateDossierPercents();
  };

  const onAddPercent = () => {
    if (percentAmount) {
      const data = {
        dossierId,
        submenuId: modalData?.submenuId,
        percentAmount: percentAmount,
      };
      saveDossierPercent({
        url: modalData?.saveApiName,
        data,
        onSuccess: (res: any) => onSuccessSavePercent(),
        onFail,
      });
    } else {
      setState({ dossierPercentError: true });
    }
  };

  const onSuccessGetPercent = (res: any) => {
    setState({ ListData: res });
  };

  const handleGateDossierPercents = () => {
    const dataQuery = { dossierId, submenuId: modalData?.submenuId };
    findDossierDPercent({
      url: modalData?.findApiName,
      data: dataQuery,
      onSuccess: (res: any) => onSuccessGetPercent(res),
      onFail,
    });
  };

  const onCloseModal = () => {
    onChangeState(modalData?.componentName, false);
    setState({
      percentAmount: '',
      dossierPercentError: false,
    });
  };
  const onSuccessSubmit = () => {
    onCloseModal();
    handleGetParentApi(modalData);
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
      lastValue={ListData?.dossierPercentInfoResult?.[0]?.percentAmount?.toString()}
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
        <div className="2xl:col-span-4 xl:col-span-4 lg:col-span-6 md:col-span-12 items-center justify-center rounded-2xl my-10">
          <TextField
            label="درصد سهام قابل عرضه"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={percentAmount}
            onChange={(value: any) => {
              setState({ percentAmount: value, dossierPercentError: '' });
            }}
            required
            type="number"
            max={100}
            errorMessage={dossierPercentError}
          />
        </div>

        <div className="2xl:col-span-8 xl:col-span-8 lg:col-span-6 md:col-span-12 items-center justify-start ">
          <Button
            className="w-32 h-9  bg-listingModalRegisterButton text-white m-4 md:m-0"
            onClick={onAddPercent}
          >
            ثبت
          </Button>
        </div>
        <div className="col-span-12 mt-5">
          <Table
            columns={filteredColumn}
            className="col-span-12 grid grid-cols-12 "
            data={
              ListData?.dossierPercentInfoResult?.length > 0
                ? ListData?.dossierPercentInfoResult
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
export default withAlert(DossierPercentModal);
