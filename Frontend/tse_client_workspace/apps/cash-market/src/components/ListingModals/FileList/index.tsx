import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import { Table } from '@tse/components/organism';
import { AntdSelectSearch, Button, Upload } from '@tse/components/atoms';
import { HeaderTypes } from '@tse/types';
import {
  modalFindApi,
  modalSaveApi,
  modalConfirmApi,
  modalRejectApi,
  modalListComponentApi,
} from 'apps/cash-market/src/Controller/Listing/Modal';
import { Icon } from '@tse/components/atoms';
import { convertDateToJalali, downloadFile } from '@tse/tools';
import { ListingModalComponent } from 'apps/cash-market/src/components/atoms/ListingModalComponent';
import { downloadFileApi, uploadFile } from 'apps/cash-market/src/Controller';
import { DownloadOutlined } from '@mui/icons-material';

export function DossierFileListModal(props: any) {
  const { isOpen, modalData, onChangeState, onAlert, handleGetParentApi } =
    props;

  const initialState = {
    selectListData: [],
    ListData: [],
    selectedValue: '',
    selectError: false,
    isShowChat: false,
    fileValue: null,
    fileValueError: false,
  };

  const [state, setState] = useStates<any>(initialState);
  const {
    selectListData,
    fileValue,
    ListData,
    selectedValue,
    selectError,
    isShowChat,
  } = state;
  const [searchParams] = useSearchParams();
  const dossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;
  const listTableHeader: HeaderTypes[] = [
    {
      title: modalData?.submenuTitle,
      dataIndex: 'amountName',
      key: 'amountName',
      className: 'col-span-2',
      render: (item: string) => <span>{item}</span>,
    },
    {
      title: 'فایل پیوست',
      dataIndex: 'attachment',
      key: 'attachment',
      render: (item: any, record: any) => (
        <a onClick={() => handleDownload(item)}>
          <span>دانلود فایل</span>
          <DownloadOutlined className="text-xl mx-2" />
        </a>
      ),
      className: `${ListData?.accessAction ? 'col-span-4' : 'col-span-5'}`,
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
              onClick={() => onAcceptTable(item?.dossierDataFileListId)}
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
              onClick={() => onRejectTable(item?.dossierDataFileListId)}
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
      className: `${ListData?.accessAction ? 'col-span-1' : 'col-span-4'}`,
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
  ];
  useEffect(() => {
    if (modalData != null && isOpen) {
      handleGetList();
      handleGetModalListComponentApi();
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
    if (fileValue) {
      const data = {
        dossierId,
        submenuId: modalData?.submenuId,
        amountId: selectedValue?.amountId,
        amountName: selectedValue?.amountName,
        attachmentId: fileValue?.fileId,
      };
      modalSaveApi({
        url: modalData?.saveApiName,
        data,
        onSuccess: (res: any) => onSuccessSave(),
        onFail,
      });
    } else {
      !fileValue && setErrorMessage('fileValue');
    }
  };

  const onSuccessSave = () => {
    setState({ selectedValue: '', fileValue: null });
    handleGetList();
  };
  const handleGetModalListComponentApi = () => {
    modalListComponentApi({
      url: modalData?.listApiName,
      onSuccess: (res: any) => setState({ selectListData: res }),
      onFail,
    });
  };

  const onAcceptTable = (id: any) => {
    const data = { dossierDataFileListId: id };
    modalConfirmApi({
      data,
      url: modalData?.confirmApiName,
      onSuccess: (res: any) => handleGetList(),
      onFail,
    });
  };

  const onRejectTable = (id: any) => {
    const data = { dossierDataFileListId: id };
    modalRejectApi({
      data,
      url: modalData?.rejectApiName,
      onSuccess: (res: any) => handleGetList(),
      onFail,
    });
  };

  const onCloseModal = () => {
    setState({ fileValueError: false, selectedValue: '', fileValue: null });
    onChangeState(modalData?.componentName, false);
  };

  const onSuccessSubmit = () => {
    setState({ fileValueError: false, selectedValue: '', fileValue: null });
    handleGetParentApi(modalData);
    onCloseModal();
  };

  const setErrorMessage = (key: string) => {
    const errorMessage = true;
    setState({ [`${key}Error`]: errorMessage });
  };

  const onChangeFile = (e: any) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) =>
        setState({ fileValue: res, fileValueError: false }),
      onFail,
    });
  };
  const onRemoveFile = () => {
    setState({
      fileValue: null,
    });
  };
  const handleDownload = (data: any) => {
    downloadFileApi({
      data: data?.fileId,
      onSuccess: (res: any) => downloadExportDoc(res, data?.fileName),
      onFail: (err: any) => console.log('onFail', err),
    });
  };
  const downloadExportDoc = (data: any, name: any) => {
    if (data != null) {
      downloadFile(data, name);
    }
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
      lastValue={ListData?.dossierFileListInfoResult?.[0]?.amountName}
    >
      <div
        className={` ${
          isShowChat
            ? '2xl:col-span-8  xl:col-span-8 lg:col-span-12 md:col-span-12'
            : 'col-span-12'
        } grid grid-cols-12  items-center justify-center bg-white rounded-2xl p-6 `}
      >
        <div className="flex col-span-12 justify-end items-center px-2">
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
        <div className=" col-span-12 grid grid-cols-12 gap-4 items-center justify-center rounded-2xl pb-6">
          <AntdSelectSearch
            label={modalData?.submenuTitle}
            className="2xl:col-span-3 xl:col-span-4 lg:col-span-6 md:col-span-6 sm:col-span-12 col-span-3 "
            data={selectListData}
            onChange={(value: any) => {
              if (value?.amountName != undefined) {
                setState({
                  selectedValue: value,
                  selectError: false,
                });
              } else if (value == '') {
                setState({
                  selectedValue: null,
                  selectError: false,
                });
              }
            }}
            // onSearch={(value: any) => handleGetSelectData(value)}
            showKey="amountName"
            idKey="amountId"
            value={selectedValue}
            error={selectError}
          />
          <div className=" 2xl:col-span-3 xl:col-span-4 lg:col-span-6 md:col-span-6 sm:col-span-12 col-span-3 items-center justify-center rounded-2xl my-10">
            <Upload
              onChange={(file: any) => onChangeFile(file)}
              value={fileValue?.fileName}
              href={fileValue?.link}
              name="fileList"
              onDelete={() => onRemoveFile()}
              error={state?.fileValueError}
            />
          </div>
          <div className="2xl:col-span-6 xl:col-span-4 lg:col-span-12 md:col-span-12 sm:col-span-12 col-span-3 flex items-center justify-start mx-4 ">
            <Button
              className="w-32 h-9  bg-listingModalRegisterButton text-white my-4"
              onClick={onSaveClick}
            >
              ثبت
            </Button>
          </div>
        </div>
        <div className="col-span-12 mt-5">
          <Table
            columns={filteredColumn}
            className="col-span-12 grid grid-cols-12 "
            data={
              ListData?.dossierFileListInfoResult?.length > 0
                ? ListData?.dossierFileListInfoResult
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
export default withAlert(DossierFileListModal);
