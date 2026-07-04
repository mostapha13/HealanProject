//API controller: DossierApprovalLetterToMarketOperation
//Component name: نامه تایید درج به واحد عملیات بازار بورس تهران

import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { useStates, useEffect, useSearchParams } from '@tse/utils';
import { Table, SmartTable } from '@tse/components/organism';
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

export function DossierFileInsertionConfirmationLetterMarketUnitModal(
  props: any
) {
  const { isOpen, modalData, onChangeState, onAlert, handleGetParentApi } =
    props;

  const initialState = {
    ListData: [],
    isShowChat: false,
    operationLetterAttachment: null,
    operationLetterAttachmentError: false,
    approvalLetterAttachment: null,
    approvalLetterAttachmentError: false,
    approvalLetterDate: '',
    approvalLetterDateError: false,
    operationLetterDate: '',
    operationLetterDateError: false,
  };

  const [state, setState] = useStates<any>(initialState);
  const {
    ListData,
    isShowChat,
    operationLetterAttachment,
    operationLetterAttachmentError,
    approvalLetterAttachment,
    approvalLetterAttachmentError,
    approvalLetterDate,
    approvalLetterDateError,
    operationLetterDate,
    operationLetterDateError,
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
    const data = { dossierDataApprovalLetterToMarketOperationId: id };
    modalConfirmApi({
      data,
      url: modalData?.confirmApiName,
      onSuccess: (res: any) => handleGetList(),
      onFail,
    });
  };

  const onRejectDossierTable = (id: any) => {
    const data = { dossierDataApprovalLetterToMarketOperationId: id };
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

  const tableHeader: HeaderTypes[] = [
    {
      title: 'تاریخ نامه درج',
      dataIndex: 'approvalLetterDate',
      key: 'approvalLetterDate',
      render: (item: any) => convertDateToJalali(item),
    },

    {
      title: 'فایل پیوست نامه درج',
      dataIndex: 'approvalLetterAttachment',
      key: 'approvalLetterAttachment',
      render: (item: any, record: any) => (
        <a onClick={() => handleDownload(item)}>
          <span>دانلود فایل</span>
          <DownloadOutlined className="text-xl mx-2" />
        </a>
      ),
    },
    {
      title: 'تاریخ نامه عملیات بازار',
      dataIndex: 'operationLetterDate',
      key: 'operationLetterDate',
      render: (item: any) => convertDateToJalali(item),
    },
    {
      title: 'فایل پیوست نامه عملیات بازار',
      dataIndex: 'operationLetterAttachment',
      key: 'operationLetterAttachment',
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
                      onAcceptDossierTable(
                        item?.dossierDataApprovalLetterToMarketOperationId
                      )
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
                      onRejectDossierTable(
                        item?.dossierDataApprovalLetterToMarketOperationId
                      )
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
        ]
      : []),
    {
      title: 'وضعیت',
      dataIndex: 'dossierStateTypeId',
      key: 'dossierStateTypeId',
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

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSuccessAddRow = () => {
    setState({
      operationLetterDate: '',
      approvalLetterDate: '',
      operationLetterAttachment: null,
      approvalLetterAttachment: null,
      operationLetterAttachmentError: false,
      approvalLetterAttachmentError: false,
      approvalLetterDateError: false,
      operationLetterDateError: false,
    });
    handleGetList();
  };

  const onAddRow = () => {
    if (
      operationLetterAttachment?.fileId &&
      operationLetterDate &&
      approvalLetterAttachment?.fileId &&
      approvalLetterDate
    ) {
      const data = {
        dossierId,
        submenuId: modalData?.submenuId,
        approvalLetterAttachmentId: approvalLetterAttachment?.fileId,
        operationLetterAttachmentId: operationLetterAttachment?.fileId,
        approvalLetterDate,
        operationLetterDate,
      };
      modalSaveApi({
        url: modalData?.saveApiName,
        data,
        onSuccess: (res: any) => onSuccessAddRow(),
        onFail,
      });
    } else {
      approvalLetterAttachment == null &&
        setState({ approvalLetterAttachmentError: true });
      operationLetterAttachment == null &&
        setState({ operationLetterAttachmentError: true }),
        !approvalLetterDate && setState({ approvalLetterDateError: true }),
        !operationLetterDate && setState({ operationLetterDateError: true });
    }
  };

  const onChangeApprovalLetterFile = (e: any) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) =>
        setState({
          approvalLetterAttachment: res,
          approvalLetterAttachmentError: false,
        }),
      onFail,
    });
  };

  const onChangeOperationLetterFile = (e: any) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) =>
        setState({
          operationLetterAttachment: res,
          operationLetterAttachmentError: false,
        }),
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
      approvalLetterAttachment: null,
      approvalLetterAttachmentError: false,
      approvalLetterDate: '',
      approvalLetterDateError: false,
      operationLetterAttachment: null,
      operationLetterAttachmentError: false,
      operationLetterDate: '',
      operationLetterDateError: false,
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

  const onChangeapprovalLetterDate = (value: any) => {
    setState({ approvalLetterDate: value, approvalLetterDateError: false });
  };

  const onChangeoperationLetterDate = (value: any) => {
    setState({ operationLetterDate: value, operationLetterDateError: false });
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
        <div className="flex col-span-12 justify-end px-2 items-center ">
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
        <div className="col-span-12 grid grid-cols-12 gap-4 py-8">
          <div className="2xl:col-span-4 xl:col-span-6 lg:col-span-6 md:col-span-12 sm:col-span-12">
            <DatePicker
              className=""
              // parentClassName="!w-[70%]"
              label="تاریخ نامه درج"
              value={approvalLetterDate}
              onChange={(value: any) => onChangeapprovalLetterDate(value)}
              onClearDate={() => onChangeapprovalLetterDate('')}
              required
              error={approvalLetterDateError}
            />
          </div>
          <Upload
            className="2xl:col-span-4 xl:col-span-6 lg:col-span-6 md:col-span-12 sm:col-span-12 lg:my-2 md:my-2"
            onChange={(file: any) => onChangeApprovalLetterFile(file)}
            value={approvalLetterAttachment?.fileName}
            href={approvalLetterAttachment?.link}
            name="insertLetterFile"
            onDelete={() => onRemoveFile()}
            error={approvalLetterAttachmentError}
            placeholder="نامه تایید درج به واحد عملیات بورس تهران"
          />
        </div>

        <div className="col-span-12 grid grid-cols-12 gap-4">
          <div className="2xl:col-span-4 xl:col-span-6 lg:col-span-6 md:col-span-12 sm:col-span-12">
            <DatePicker
              className=""
              // parentClassName="!w-[70%]"
              label="تاریخ نامه عملیات بازار"
              value={operationLetterDate}
              onChange={(value: any) => onChangeoperationLetterDate(value)}
              onClearDate={() => onChangeoperationLetterDate('')}
              required
              error={operationLetterDateError}
            />
          </div>
          <Upload
            className="2xl:col-span-4 xl:col-span-6 lg:col-span-6 md:col-span-12 sm:col-span-12 lg:my-2 md:my-2"
            onChange={(file: any) => onChangeOperationLetterFile(file)}
            value={operationLetterAttachment?.fileName}
            href={operationLetterAttachment?.link}
            name="marketLetterFile"
            onDelete={() => onRemoveFile()}
            error={operationLetterAttachmentError}
            placeholder="نامه عملیات بازار به سپرده گذاری مرکزی"
          />
          <div className="2xl:col-span-5 xl:col-span-4 lg:col-span-12 md:col-span-12 sm:col-span-12 flex items-start">
            <Button
              className="w-32 h-9 bg-listingModalRegisterButton text-white"
              onClick={onAddRow}
            >
              ثبت
            </Button>
          </div>
        </div>
        <div className="col-span-12 mt-32">
          <SmartTable
            columns={tableHeader}
            data={
              ListData?.dossierDataApprovalLetterToMarketOperationInfoResult
                ?.length > 0
                ? ListData?.dossierDataApprovalLetterToMarketOperationInfoResult
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
export default withAlert(DossierFileInsertionConfirmationLetterMarketUnitModal);
