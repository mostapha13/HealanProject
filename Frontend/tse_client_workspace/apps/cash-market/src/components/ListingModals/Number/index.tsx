import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import { Table } from '@tse/components/organism';
import { Button, TextField } from '@tse/components/atoms';
import { HeaderTypes } from '@tse/types';
import {
  findDossierNumeric,
  saveDossierNumeric,
  confirmDossierNumeric,
  rejectDossierNumeric,
} from 'apps/cash-market/src/Controller/Listing/Modal';
import { Icon } from '@tse/components/atoms';
import { separator } from '@tse/tools';
import { ListingModalComponent } from 'apps/cash-market/src/components/atoms/ListingModalComponent';

export function DossierNumberModal(props: any) {
  const { isOpen, modalData, onChangeState, onAlert, handleGetParentApi } =
    props;

  const initialState = {
    numericAmount: '',
    dossierNumericError: false,
    ListData: [],
    isShowChat: false,
  };

  const [state, setState] = useStates<any>(initialState);
  const { numericAmount, dossierNumericError, ListData, isShowChat } = state;
  const [searchParams] = useSearchParams();
  const dossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;

  useEffect(() => {
    if (modalData != null && isOpen) {
      handleGateDossierNumerics();
    }
  }, [modalData]);

  const onAcceptDossierTable = (id: any) => {
    handleConfirmDossierNumeric(id);
  };

  const onRejectDossierTable = (id: any) => {
    handleRejectDossierNumeric(id);
  };

  const handleConfirmDossierNumeric = (id: any) => {
    const data = { dossierDataNumericId: id };

    confirmDossierNumeric({
      data,
      url: modalData?.confirmApiName,
      onSuccess: (res: any) => handleGateDossierNumerics(),
      onFail,
    });
  };

  const handleRejectDossierNumeric = (id: any) => {
    const data = { dossierDataNumericId: id };
    rejectDossierNumeric({
      data,
      url: modalData?.rejectApiName,
      onSuccess: (res: any) => handleGateDossierNumerics(),
      onFail,
    });
  };

  const licenseTableHeader: HeaderTypes[] = [
    {
      title: modalData?.submenuTitle,
      dataIndex: 'numericAmount',
      key: 'numericAmount',
      className: `${
        ListData?.accessAction ? 'col-span-3' : 'col-span-6'
      }`,
      render: (_: any, item: any) => {
        return <span>{separator(item?.numericAmount)}</span>;
      },
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
              className="w-16 h-7 bg-dossierModalTableConfirmButton text-white ml-2"
              onClick={() => onAcceptDossierTable(item?.dossierDataNumericId)}
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
              onClick={() => onRejectDossierTable(item?.dossierDataNumericId)}
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
        ListData?.accessAction ? 'col-span-4' : 'col-span-5'
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

  const onSuccessSaveNumeric = () => {
    setState({ numericAmount: '' });
    handleGateDossierNumerics();
  };

  const onAddNumeric = () => {
    if (numericAmount) {
      const data = {
        dossierId,
        submenuId: modalData?.submenuId,
        numericAmount,
      };
      saveDossierNumeric({
        url: modalData?.saveApiName,
        data,
        onSuccess: (res: any) => onSuccessSaveNumeric(),
        onFail,
      });
    } else {
      setState({ dossierNumericError: true });
    }
  };

  const onSuccessGetNumeric = (res: any) => {
    setState({ ListData: res });
  };

  const handleGateDossierNumerics = () => {
    const dataQuery = { dossierId, submenuId: modalData?.submenuId };
    findDossierNumeric({
      url: modalData?.findApiName,
      data: dataQuery,
      onSuccess: (res: any) => onSuccessGetNumeric(res),
      onFail,
    });
  };

  const onCloseModal = () => {
    onChangeState(modalData?.componentName, false);
    setState({ numericAmount: '', dossierNumericError: false });
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
      lastValue= {separator(
        ListData?.dossierNumericInfoResult?.[0]?.numericAmount
      )?.toString()}
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
            label={modalData?.submenuTitle}
            // className="col-span-3"
            value={numericAmount}
            onChange={(value: any) =>
              setState({
                numericAmount: value,
                dossierNumericError: false,
              })
            }
            required
            errorMessage={dossierNumericError}
            type="numeric"
          />
        </div>

        <div className="2xl:col-span-8 xl:col-span-8 lg:col-span-6 md:col-span-1 items-center justify-start">
          <Button
            className="w-32 h-9 bg-listingModalRegisterButton text-white m-4 md:m-0"
            onClick={onAddNumeric}
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
              ListData?.dossierNumericInfoResult?.length > 0
                ? ListData?.dossierNumericInfoResult
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
export default withAlert(DossierNumberModal);
