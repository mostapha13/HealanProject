import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import { Table } from '@tse/components/organism';
import { Button, Upload } from '@tse/components/atoms';
import { HeaderTypes } from '@tse/types';
import {
  modalFindApi,
  modalSaveApi,
  modalConfirmApi,
  modalRejectApi,
} from 'apps/cash-market/src/Controller/Listing/Modal';
import { Icon } from '@tse/components/atoms';
import { ListingModalComponent } from '../../atoms/ListingModalComponent';
import { DatePicker } from '@tse/components/molecules';
import { uploadFile, downloadFileApi } from 'apps/cash-market/src/Controller';
import { convertDateToJalali, downloadFile } from '@tse/tools';
import { DownloadOutlined } from '@mui/icons-material';

export function DossierFileDateModal(props: any) {
  const { isOpen, modalData, onChangeState, onAlert, handleGetParentApi } =
    props;

  const initialState = {
    ListData: [],
    isShowChat: false,
    fileUpload: null,
    fileUploadError: false,
    date: '',
    dateError: false,
  };

  const [state, setState] = useStates<any>(initialState);
  const { ListData, isShowChat, fileUpload, fileUploadError, date, dateError } =
    state;
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
    const data = { dossierDataFileDateId: id };

    modalConfirmApi({
      data,
      url: modalData?.confirmApiName,
      onSuccess: (res: any) => handleGetList(),
      onFail,
    });
  };

  const handleRejectRecord = (id: any) => {
    const data = { dossierDataFileDateId: id };
    modalRejectApi({
      data,
      url: modalData?.rejectApiName,
      onSuccess: (res: any) => handleGetList(),
      onFail,
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

  const licenseTableHeader: HeaderTypes[] = [
    {
      title: modalData?.submenuTitle,
      dataIndex: 'date',
      key: 'date',
      className: 'col-span-2',
      render: (item: any) => convertDateToJalali(item),
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
              onClick={() => onAcceptDossierTable(item?.dossierDataFileDateId)}
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
              onClick={() => onRejectDossierTable(item?.dossierDataFileDateId)}
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

  const filteredColumn = ListData?.accessAction
    ? licenseTableHeader
    : licenseTableHeader?.filter((column: any) => column?.key != 'action');

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSuccessAddRow = () => {
    setState({ date: '', fileUpload: null });
    handleGetList();
  };

  const onAddRow = () => {
    if (date && fileUpload?.fileId) {
      const data = {
        dossierId,
        submenuId: modalData?.submenuId,
        date,
        attachmentId: fileUpload?.fileId,
      };
      modalSaveApi({
        url: modalData?.saveApiName,
        data,
        onSuccess: (res: any) => onSuccessAddRow(),
        onFail,
      });
    } else {
      setState({
        dateError: true,
        fileUploadError: true,
      });
    }
  };

  const onChangeFile = (e: any) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) =>
        setState({ fileUpload: res, fileUploadError: false }),
      onFail,
    });
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
      date: '',
      dateError: false,
      fileUpload: null,
      fileUploadError: false,
    });
  };

  const onSuccessSubmit = () => {
    handleGetParentApi(modalData);
    onCloseModal();
  };

  const onRemoveFile = () => {
    setState({
      fileUpload: null,
    });
  };

  const onChangeDate = (value: any) => {
    setState({ date: value, dateError: false });
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
      lastValue={`${convertDateToJalali(
        ListData?.dossierFileDateInfoResult?.[0]?.date
      )}`}
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
        <div className="col-span-12 grid grid-cols-12 gap-4">
          <div className="2xl:col-span-3 xl:col-span-4 lg:col-span-6 md:col-span-12 sm:col-span-12">
            <DatePicker
              className=""
              // parentClassName="!w-[70%]"
              label={modalData?.submenuTitle}
              value={date}
              onChange={(value: any) => onChangeDate(value)}
              onClearDate={() => onChangeDate('')}
              required
              error={dateError}
            />
          </div>
          <Upload
            className="2xl:col-span-3 xl:col-span-4 lg:col-span-6 md:col-span-12 sm:col-span-12 lg:my-2 md:my-2"
            onChange={(file: any) => onChangeFile(file)}
            value={fileUpload?.fileName}
            href={fileUpload?.link}
            name="modalFileDate"
            onDelete={() => onRemoveFile()}
            error={fileUploadError}
          />
          <div className="2xl:col-span-6 xl:col-span-4 lg:col-span-12 md:col-span-12 sm:col-span-12 items-center justify-start">
            <Button
              className="w-32 h-9 bg-listingModalRegisterButton text-white mx-4"
              onClick={onAddRow}
            >
              ثبت
            </Button>
          </div>
        </div>
        <div className="col-span-12 mt-32">
          <Table
            columns={filteredColumn}
            className="col-span-12 grid grid-cols-12 "
            data={
              ListData?.dossierFileDateInfoResult?.length > 0
                ? ListData?.dossierFileDateInfoResult
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
export default withAlert(DossierFileDateModal);
