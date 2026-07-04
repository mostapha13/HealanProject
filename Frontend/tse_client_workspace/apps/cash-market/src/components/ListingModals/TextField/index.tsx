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
import { Button, TextField } from '@tse/components/atoms';
import { HeaderTypes } from '@tse/types';
import './style.css';
import {
  findDossierText,
  saveDossierText,
  confirmDossierText,
  rejectDossierText,
} from 'apps/cash-market/src/Controller/Listing/Modal';
import { Icon } from '@tse/components/atoms';
import { ListingModalComponent } from 'apps/cash-market/src/components/atoms/ListingModalComponent';

export function DossierTextFieldModal(props: any) {
  const { isOpen, modalData, onChangeState, onAlert, handleGetParentApi } =
    props;

  const initialState = {
    textAmount: '',
    ListData: '',
    dossierTextFieldError: false,
    isShowChat: false,
  };

  const [state, setState] = useStates<any>(initialState);
  const { textAmount, ListData, dossierTextFieldError, isShowChat } = state;
  const [searchParams] = useSearchParams();
  const dossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;

  useEffect(() => {
    if (modalData != null && isOpen) {
      handleGateDossierText();
    }
  }, [modalData]);

  const onAcceptDossierTable = (id: any) => {
    handleConfirmDossierText(id);
  };

  const onRejectDossierTable = (id: any) => {
    handleRejectDossierText(id);
  };

  const handleConfirmDossierText = (id: any) => {
    const data = { dossierDataTextId: id };

    confirmDossierText({
      data,
      url: modalData?.confirmApiName,
      onSuccess: (res: any) => handleGateDossierText(),
      onFail,
    });
  };

  const handleRejectDossierText = (id: any) => {
    const data = { dossierDataTextId: id };
    rejectDossierText({
      data,
      url: modalData?.rejectApiName,
      onSuccess: (res: any) => handleGateDossierText(),
      onFail,
    });
  };

  const licenseTableHeader: HeaderTypes[] = [
    {
      title: modalData?.submenuTitle,
      dataIndex: 'textAmount',
      key: 'textAmount',
      className: `${ListData?.accessAction ? 'col-span-3' : 'col-span-6'}`,
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
              onClick={() => onAcceptDossierTable(item?.dossierDataTextId)}
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
              onClick={() => onRejectDossierTable(item?.dossierDataTextId)}
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
      className: `${ListData?.accessAction ? 'col-span-4' : 'col-span-5'}`,
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

  const onSuccessSaveText = () => {
    setState({ textAmount: '' });
    handleGateDossierText();
  };

  const onAddText = () => {
    if (textAmount) {
      const data = { dossierId, submenuId: modalData?.submenuId, textAmount };
      saveDossierText({
        url: modalData?.saveApiName,
        data,
        onSuccess: (res: any) => onSuccessSaveText(),
        onFail,
      });
    } else {
      setState({ dossierTextFieldError: true });
    }
  };

  const onSuccessGetText = (res: any) => {
    setState({ ListData: res });
  };

  const handleGateDossierText = () => {
    const dataQuery = { dossierId, submenuId: modalData?.submenuId };
    findDossierText({
      url: modalData?.findApiName,
      data: dataQuery,
      onSuccess: (res: any) => onSuccessGetText(res),
      onFail,
    });
  };

  const onCloseModal = () => {
    onChangeState(modalData?.componentName, false);
    setState({
      textAmount: '',
      dossierTextFieldError: false,
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
      lastValue={ListData?.dossierTextInfoResult?.[0]?.textAmount}
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
            value={textAmount}
            onChange={(value: any) =>
              setState({
                textAmount: value,
                dossierTextFieldError: false,
              })
            }
            required
            errorMessage={dossierTextFieldError}
            // type="Text"
          />
        </div>

        <div className="2xl:col-span-8 xl:col-span-8 lg:col-span-6 md:col-span-12 items-center justify-start">
          <Button
            className="w-32 h-9  bg-listingModalRegisterButton text-white m-4"
            onClick={onAddText}
          >
            ثبت
          </Button>
        </div>
        <div className="col-span-12 mt-5">
          <Table
            columns={filteredColumn}
            className="col-span-12 grid grid-cols-12 "
            data={
              ListData?.dossierTextInfoResult?.length > 0
                ? ListData?.dossierTextInfoResult
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
export default withAlert(DossierTextFieldModal);
