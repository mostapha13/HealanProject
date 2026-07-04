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
  findDossierTextArea,
  saveDossierTextArea,
  confirmDossierTextArea,
  rejectDossierTextArea,
} from 'apps/cash-market/src/Controller/Listing/Modal';
import { Icon } from '@tse/components/atoms';
import { Input } from 'antd';
import { ListingModalComponent } from 'apps/cash-market/src/components/atoms/ListingModalComponent';

const { TextArea } = Input;
export function DossierTextAreaModal(props: any) {
  const { isOpen, modalData, onChangeState, onAlert, handleGetParentApi } =
    props;

  const initialState = {
    textAreaAmount: '',
    textAreaAmountError: false,
    ListData: [],
    isShowChat: false,
  };

  const [state, setState] = useStates<any>(initialState);
  const { textAreaAmount, textAreaAmountError, ListData, isShowChat } = state;
  const [searchParams] = useSearchParams();
  const dossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;

  useEffect(() => {
    if (modalData != null && isOpen) {
      handleGateDossierTextArea();
    }
  }, [modalData]);

  const onAcceptDossierTable = (id: any) => {
    handleConfirmDossierTextArea(id);
  };

  const onRejectDossierTable = (id: any) => {
    handleRejectDossierTextArea(id);
  };

  const handleConfirmDossierTextArea = (id: any) => {
    const data = { dossierDataTextAreaId: id };
    confirmDossierTextArea({
      data,
      url: modalData?.confirmApiName,
      onSuccess: (res: any) => handleGateDossierTextArea(),
      onFail,
    });
  };

  const handleRejectDossierTextArea = (id: any) => {
    const data = { dossierDataTextAreaId: id };
    rejectDossierTextArea({
      data,
      url: modalData?.rejectApiName,
      onSuccess: (res: any) => handleGateDossierTextArea(),
      onFail,
    });
  };

  const licenseTableHeader: HeaderTypes[] = [
    {
      title: modalData?.submenuTitle,
      dataIndex: 'textAreaAmount',
      key: 'textAreaAmount',
      className: `${ListData?.accessAction ? 'col-span-4' : 'col-span-7'}`,
    },
    {
      title: 'اعمال وضعیت',
      dataIndex: 'action',
      key: 'action',
      className: 'col-span-3 !justify-center',
      render: (_: any, item: any) => {
        return (
          <div className="flex flex-row items-center flitems-center justify-center">
            <Button
              className="w-16 h-7  bg-dossierModalTableConfirmButton text-white ml-2"
              onClick={() => onAcceptDossierTable(item?.dossierDataTextAreaId)}
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
              onClick={() => onRejectDossierTable(item?.dossierDataTextAreaId)}
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
      className: `${ListData?.accessAction ? 'col-span-4' : 'col-span-4'}`,
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

  const onSuccessSaveTextArea = () => {
    setState({ textAreaAmount: '' });
    handleGateDossierTextArea();
  };

  const onAddTextArea = () => {
    if (textAreaAmount) {
      const data = {
        dossierId,
        submenuId: modalData?.submenuId,
        textAreaAmount,
      };
      saveDossierTextArea({
        url: modalData?.saveApiName,
        data,
        onSuccess: onSuccessSaveTextArea,
        onFail,
      });
    } else {
      setState({ textAreaAmountError: true });
    }
  };

  const onSuccessGetTextArea = (res: any) => {
    setState({ ListData: res });
  };

  const handleGateDossierTextArea = () => {
    const dataQuery = { dossierId, submenuId: modalData?.submenuId };
    findDossierTextArea({
      url: modalData?.findApiName,
      data: dataQuery,
      onSuccess: (res: any) => onSuccessGetTextArea(res),
      onFail,
    });
  };

  const onCloseModal = () => {
    onChangeState(modalData?.componentName, false);
    setState({
      textAreaAmount: '',
      textAreaAmountError: false,
    });
  };

  const onSuccessSubmit = () => {
    handleGetParentApi(modalData);
    onCloseModal();
  };

  const onChangeTextArea = (e: any) => {
    setState({ textAreaAmount: e?.target?.value, textAreaAmountError: false });
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
      lastValue={ListData?.dossierTextAreaInfoResult?.[0]?.textAreaAmount}
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
        <div className="col-span-12 items-center justify-center rounded-2xl mt-10">
          <TextArea
            className={`${
              textAreaAmountError ? 'border border-red' : 'border-gray'
            }`}
            placeholder={modalData?.submenuTitle}
            rows={4}
            // maxLength={60}
            onChange={onChangeTextArea}
            value={textAreaAmount}
          />
        </div>

        <div className="col-span-12 items-center flex justify-end">
          <Button
            className="w-32 h-9 bg-listingModalRegisterButton text-white my-4 md:m-0"
            onClick={onAddTextArea}
          >
            ثبت
          </Button>
        </div>
        <div className="col-span-12 mt-5">
          <Table
            columns={filteredColumn}
            className="col-span-12 grid grid-cols-12 "
            data={
              ListData?.dossierTextAreaInfoResult?.length > 0
                ? ListData?.dossierTextAreaInfoResult
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
export default withAlert(DossierTextAreaModal);
