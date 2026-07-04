//API controller: DossierManagementLetterAuditor
//Component name: نامه مدیریت حسابرس مستقل و بازرس قانونی

import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import { SmartTable,Table } from '@tse/components/organism';
import { Button, TextField, Upload } from '@tse/components/atoms';
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

////////////////DossierManagementLetterAuditor API////////////////////////
export function DossierFileAuditorLetterModal(props: any) {
  const { isOpen, modalData, onChangeState, onAlert, handleGetParentApi } =
    props;

  const initialState = {
    ListData: [],
    isShowChat: false,
    fileUpload: null,
    fileUploadError: false,
    dateValue: '',
    dateValueError: false,
    textValue: '',
    textValueError: false,
  };

  const [state, setState] = useStates<any>(initialState);
  const {
    ListData,
    isShowChat,
    fileUpload,
    fileUploadError,
    dateValue,
    dateValueError,
    textValue,
    textValueError,
  } = state;
  const [searchParams] = useSearchParams();
  const dossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;

  const tableHeader: HeaderTypes[] = [
    {
      title: 'تاریخ نامه',
      dataIndex: 'letterDate',
      key: 'letterDate',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'نام حسابرس',
      dataIndex: 'auditorName',
      key: 'auditorName',
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
    },
    ...(ListData?.accessAction
      ? [
          {
            title: 'اعمال وضعیت',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, item: any) => {
              return (
                <div className="flex flex-row items-center flitems-center justify-center">
                  <Button
                    className="w-16 h-7  bg-dossierModalTableConfirmButton text-white ml-2"
                    onClick={() =>
                      onAcceptTable(item?.dossierDataManagementLetterAuditorId)
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
                      onRejectTable(item?.dossierDataManagementLetterAuditorId)
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
        ]
      : []),
    ...(ListData?.accessSignature
      ? [
          {
            title: 'امضای دیجیتال',
            dataIndex: 'attachment',
            key: 'attachment',
            render: (item: any, record: any) => <span></span>,
          },
                  {
            title: 'امضا کنندگان',
            dataIndex: 'attachment',
            key: 'attachment',
            render: (item: any, record: any) => <span></span>,
          },
        ]
      : []),
    {
      title: 'وضعیت',
      dataIndex: 'dossierStateTypeId',
      key: 'dossierStateTypeId',
      className: `${ListData?.accessAction ? 'col-span-1' : 'col-span-1'}`,
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
    }
  }, [modalData]);
  const setErrorMessage = (key: string) => {
    const errorMessage = true;
    setState({ [`${key}Error`]: errorMessage });
  };
  const onAcceptTable = (id: any) => {
    const data = { dossierDataManagementLetterAuditorId: id };
    modalConfirmApi({
      data,
      url: modalData?.confirmApiName,
      onSuccess: (res: any) => handleGetList(),
      onFail,
    });
  };

  const onRejectTable = (id: any) => {
    const data = { dossierDataManagementLetterAuditorId: id };
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

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSuccessAddRow = () => {
    setState({ dateValue: '', fileUpload: null, textValue: '' });
    handleGetList();
  };

  const onAddRow = () => {
    if (dateValue && textValue && fileUpload?.fileId) {
      const data = {
        dossierId,
        submenuId: modalData?.submenuId,
        letterDate: dateValue,
        auditorName: textValue,
        attachmentId: fileUpload?.fileId,
      };
      modalSaveApi({
        url: modalData?.saveApiName,
        data,
        onSuccess: (res: any) => onSuccessAddRow(),
        onFail,
      });
    } else {
      !dateValue && setErrorMessage('dateValue');
      !textValue && setErrorMessage('textValue');
      !fileUpload?.fileId && setErrorMessage('fileUpload');
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
    setState({ dateValue: value, dateValueError: false });
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
      lastValue={`${ListData?.dossierManagementLetterAuditorInfoResult?.[0]?.auditorName}`}
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
        <div className="col-span-12 grid grid-cols-12 gap-4  mt-4">
          <div className="2xl:col-span-3 xl:col-span-4 lg:col-span-6 md:col-span-12 sm:col-span-12">
            <DatePicker
              // parentClassName="!w-[70%]"
              label="تاریخ نامه"
              value={dateValue}
              onChange={(value: any) => onChangeDate(value)}
              onClearDate={() => onChangeDate('')}
              required
              error={dateValueError}
            />
          </div>
          <TextField
            label="نام حسابرس"
            className="2xl:col-span-3 xl:col-span-4 lg:col-span-6 md:col-span-12 sm:col-span-12"
            value={textValue}
            onChange={(value: any) =>
              setState({
                textValue: value,
                textValueError: false,
              })
            }
            required
            errorMessage={textValueError}
          />
          <Upload
            className="2xl:col-span-3 xl:col-span-4 lg:col-span-12 md:col-span-12 sm:col-span-12 lg:my-2 md:my-2"
            onChange={(file: any) => onChangeFile(file)}
            value={fileUpload?.fileName}
            href={fileUpload?.link}
            name="modalFileAuditorLetter"
            onDelete={() => onRemoveFile()}
            error={fileUploadError}
          />
          <div className="2xl:col-span-3 xl:col-span-12 lg:col-span-12 md:col-span-12 sm:col-span-12 items-center justify-start">
            <Button
              className="w-32 h-9 bg-listingModalRegisterButton text-white mx-4"
              onClick={onAddRow}
            >
              ثبت
            </Button>
          </div>
        </div>
        <div className="col-span-12 mt-32">
          <SmartTable
            columns={tableHeader}
            className="col-span-12 grid grid-cols-12 "
            data={
              ListData?.dossierManagementLetterAuditorInfoResult?.length > 0
                ? ListData?.dossierManagementLetterAuditorInfoResult
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
export default withAlert(DossierFileAuditorLetterModal);
