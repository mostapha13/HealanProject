//API controller: DossierInquiryApplicantCompany
//Component name: استعلام مدیران و سهامداران شرکت متقاضی

import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import { Table, SmartTable } from '@tse/components/organism';
import { AntdSelectSearch, Button, Upload } from '@tse/components/atoms';
import { HeaderTypes } from '@tse/types';
import {
  modalFindApi,
  modalSaveApi,
  modalConfirmApi,
  modalRejectApi,
  modificationAssociation,
  inquiryApplicantCompanyType,
} from 'apps/cash-market/src/Controller/Listing/Modal';
import { Icon, TextField } from '@tse/components/atoms';
import { convertDateToJalali, downloadFile } from '@tse/tools';
import { ListingModalComponent } from 'apps/cash-market/src/components/atoms/ListingModalComponent';
import { downloadFileApi, uploadFile } from 'apps/cash-market/src/Controller';
import { DatePicker } from '@tse/components/molecules';
import { Radio, RadioChangeEvent } from 'antd';
import { DownloadOutlined } from '@mui/icons-material';

export function DossierFileInquiryApplicantCompanyModal(props: any) {
  const { isOpen, modalData, onChangeState, onAlert, handleGetParentApi } =
    props;

  const initialState = {
    ListData: [],
    radioList: [],
    isShowChat: false,
    fileValue: null,
    fileValueError: false,
    radioValue: 'TseAntimoney',
    fileValueReply: null,
    fileValueReplyError: false,
  };

  const [state, setState] = useStates<any>(initialState);
  const {
    ListData,
    radioList,
    fileValue,
    fileValueReply,
    isShowChat,
    radioValue,
  } = state;
  const [searchParams] = useSearchParams();
  const dossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;
  const tableHeader: HeaderTypes[] = [
    {
      title: 'نوع',
      dataIndex: 'inquiryApplicantCompanyTypeName',
      key: 'inquiryApplicantCompanyTypeName',
    },
    {
      title: 'فایل استعلام',
      dataIndex: 'attachment',
      key: 'attachment',
      render: (item: any, record: any) => (
        <a onClick={() => handleDownload(item)}>
          <span>دانلود فایل</span>
          <DownloadOutlined className="text-xl mx-2" />
        </a>
      ),
    },
    {
      title: 'فایل پاسخ استعلام',
      dataIndex: 'inquiryResponseAttachment',
      key: 'inquiryResponseAttachment',
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
                      onAcceptTable(item?.dossierDataInquiryApplicantCompanyId)
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
                      onRejectTable(item?.dossierDataInquiryApplicantCompanyId)
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
      handleGetRadioList();
    }
  }, [modalData]);

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
    if (fileValue && fileValueReply) {
      const data = {
        dossierId,
        submenuId: modalData?.submenuId,
        attachmentId: fileValue?.fileId,
        inquiryResponseAttachmentId: fileValueReply?.fileId,
        inquiryApplicantCompanyTypeId: radioValue,
      };
      modalSaveApi({
        url: modalData?.saveApiName,
        data,
        onSuccess: (res: any) => onSuccessSave(),
        onFail,
      });
    } else {
      !fileValue && setErrorMessage('fileValue');
      !fileValueReply && setErrorMessage('fileValueReply');
    }
  };

  const onSuccessSave = () => {
    setState({
      fileValue: null,
      fileValueReply: null,
      radioValue: 'TseAntimoney',
    });
    handleGetList();
  };
  const handleGetRadioList = () => {
    inquiryApplicantCompanyType({
      onSuccess: (res: any) => setState({ radioList: res }),
      onFail,
    });
  };
  const onAcceptTable = (id: any) => {
    const data = { dossierDataInquiryApplicantCompanyId: id };
    modalConfirmApi({
      data,
      url: modalData?.confirmApiName,
      onSuccess: (res: any) => handleGetList(),
      onFail,
    });
  };

  const onRejectTable = (id: any) => {
    const data = { dossierDataInquiryApplicantCompanyId: id };
    modalRejectApi({
      data,
      url: modalData?.rejectApiName,
      onSuccess: (res: any) => handleGetList(),
      onFail,
    });
  };

  const onCloseModal = () => {
    setState({
      fileValueError: false,
      fileValueReplyError: false,
      fileValue: null,
      fileValueReply: null,
      radioValue: 'TseAntimoney',
    });
    onChangeState(modalData?.componentName, false);
  };

  const onSuccessSubmit = () => {
    setState({
      fileValueError: false,
      fileValueReplyError: false,
      fileValue: null,
      fileValueReply: null,
      radioValue: 'TseAntimoney',
    });
    handleGetParentApi(modalData);
    onCloseModal();
  };

  const setErrorMessage = (key: string) => {
    const errorMessage = true;
    setState({ [`${key}Error`]: errorMessage });
  };
  const onChangeFile = (e: any, state: string, stateError: string) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) => setState({ [state]: res, [stateError]: false }),
      onFail,
    });
  };
  const onRemoveFile = () => {
    setState({
      fileValue: null,
    });
  };

  const handleRadioChange = (e: RadioChangeEvent) => {
    setState({
      radioValue: e.target.value,
      textValue: '',
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
      lastValue={
        ListData?.dossierInquiryApplicantCompanyInfoResult?.[0]
          ?.inquiryApplicantCompanyTypeName
      }
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
        <div className=" col-span-12 grid grid-cols-12 gap-4 items-center justify-center rounded-2xl my-2">
          <div className="col-span-12">
            <Radio.Group
              onChange={handleRadioChange}
              value={radioValue}
              style={{ marginBottom: 5 }}
            >
              {radioList?.map((item: any) => (
                <Radio value={item?.name}>{item?.displayName}</Radio>
              ))}
            </Radio.Group>
          </div>
          <div className=" col-span-12 grid grid-cols-12 items-center justify-center gap-4 rounded-2xl my-2">
            <div className=" 2xl:col-span-5 xl:col-span-6 lg:col-span-6 md:col-span-12 sm:col-span-12 items-center justify-center rounded-2xl my-2">
              <div className="mb-4">
                <span className="font-bold">فایل استعلام :</span>
              </div>
              <Upload
                onChange={(file: any) =>
                  onChangeFile(file, 'fileValue', 'fileValueError')
                }
                value={fileValue?.fileName}
                href={fileValue?.link}
                name="modalFileInqueryApplicant"
                onDelete={() => onRemoveFile()}
                error={state?.fileValueError}
              />
            </div>
            <div className=" 2xl:col-span-5 xl:col-span-6 lg:col-span-6 md:col-span-12 sm:col-span-12 items-center justify-center rounded-2xl my-2 2xl:mr-14 xl:mr-14">
              <div className="mb-4">
                <span className="font-bold">پاسخ استعلام :</span>
              </div>
              <Upload
                onChange={(file: any) =>
                  onChangeFile(file, 'fileValueReply', 'fileValueReplyError')
                }
                value={fileValueReply?.fileName}
                href={fileValueReply?.link}
                name="modalFileInqueryApplicantReply"
                onDelete={() => onRemoveFile()}
                error={state?.fileValueReplyError}
              />
            </div>
            <div className="2xl:col-span-2 col-span-12  flex items-center justify-end 2xl:mt-8">
              <Button
                className="w-32 h-9  bg-listingModalRegisterButton text-white my-4"
                onClick={onSaveClick}
              >
                ثبت
              </Button>
            </div>
          </div>
        </div>
        <div className="col-span-12 mt-16">
          <SmartTable
            columns={tableHeader}
            data={
              ListData?.dossierInquiryApplicantCompanyInfoResult?.length > 0
                ? ListData?.dossierInquiryApplicantCompanyInfoResult
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
export default withAlert(DossierFileInquiryApplicantCompanyModal);
