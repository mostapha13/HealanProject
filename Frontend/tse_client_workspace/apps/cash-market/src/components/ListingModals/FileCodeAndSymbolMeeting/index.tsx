//API controller: DossierSymbolAndCodeResolution
//Component name: صورتجلسه کد و نماد

import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { useStates, useEffect, useState, useSearchParams } from '@tse/utils';
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
import { uploadFile, downloadFileApi } from 'apps/cash-market/src/Controller';
import { convertDateToJalali, downloadFile } from '@tse/tools';
import { DownloadOutlined } from '@mui/icons-material';

export function DossierFileCodeAndSymbolMeetingModal(props: any) {
  const { isOpen, modalData, onChangeState, onAlert, handleGetParentApi } =
    props;

  const initialState = {
    ListData: [],
    isShowChat: false,
    confirmationLetterAttachment: null,
    symbolAndCodeAttachment: null,
    confirmationLetterAttachmentError: false,
    symbolAndCodeAttachmentError: false,
  };

  const [state, setState] = useStates<any>(initialState);
  const {
    ListData,
    isShowChat,
    confirmationLetterAttachment,
    symbolAndCodeAttachment,
    confirmationLetterAttachmentError,
    symbolAndCodeAttachmentError,
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
    const data = { dossierDataSymbolAndCodeResolutionId: id };
    modalConfirmApi({
      data,
      url: modalData?.confirmApiName,
      onSuccess: (res: any) => handleGetList(),
      onFail,
    });
  };

  const onRejectDossierTable = (id: any) => {
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

  const tableHeader: HeaderTypes[] = [
    {
      title: 'نامه احراز شرایط',
      dataIndex: 'confirmationLetterAttachment',
      key: 'confirmationLetterAttachment',
      render: (item: any, record: any) => (
        <a onClick={() => handleDownload(item)}>
          <span>دانلود فایل</span>
          <DownloadOutlined className="text-xl mx-2" />
        </a>
      ),
    },
    {
      title: 'فایل صورت جلسه',
      dataIndex: 'symbolAndCodeAttachment',
      key: 'symbolAndCodeAttachment',
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
                        item?.dossierDataSymbolAndCodeResolutionId
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
                        item?.dossierDataSymbolAndCodeResolutionId
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

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSuccessAddRow = () => {
    setState({
      confirmationLetterAttachment: null,
      symbolAndCodeAttachment: null,
    });
    handleGetList();
  };

  const onAddRow = () => {
    if (
      symbolAndCodeAttachment?.fileId &&
      confirmationLetterAttachment?.fileId
    ) {
      const data = {
        dossierId: dossierId,
        submenuId: modalData?.submenuId,
        symbolAndCodeAttachmentId: symbolAndCodeAttachment?.fileId,
        confirmationLetterAttachmentId: confirmationLetterAttachment?.fileId,
      };
      modalSaveApi({
        url: modalData?.saveApiName,
        data,
        onSuccess: (res: any) => onSuccessAddRow(),
        onFail,
      });
    } else {
      symbolAndCodeAttachment == null &&
        setState({ symbolAndCodeAttachmentError: true });
      confirmationLetterAttachment == null &&
        setState({ confirmationLetterAttachmentError: true });
    }
  };

  const onChangeLetterFile = (e: any) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) =>
        setState({
          confirmationLetterAttachment: res,
          confirmationLetterAttachmentError: false,
        }),
      onFail,
    });
  };

  const onChangeSessionFile = (e: any) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) =>
        setState({
          symbolAndCodeAttachment: res,
          symbolAndCodeAttachmentError: false,
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
      date: '',
      dateError: false,
      confirmationLetterAttachment: null,
      confirmationLetterAttachmentError: false,
      symbolAndCodeAttachment: null,
      symbolAndCodeAttachmentError: false,
    });
  };

  const onSuccessSubmit = () => {
    handleGetParentApi(modalData);
    onCloseModal();
  };

  const onRemoveConfirmationLetterFile = () => {
    setState({
      confirmationLetterAttachment: null,
    });
  };
  const onRemoveSymbolAndCodeFile = () => {
    setState({
      symbolAndCodeAttachment: null,
    });
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
        <div className="col-span-12 grid grid-cols-12 gap-4 py-10">
          <Upload
            className="2xl:col-span-4 xl:col-span-5 lg:col-span-6 md:col-span-12 sm:col-span-12 lg:my-2 md:my-2"
            onChange={(file: any) => onChangeLetterFile(file)}
            value={confirmationLetterAttachment?.fileName}
            href={confirmationLetterAttachment?.link}
            name="confirmationLetterFile"
            onDelete={() => onRemoveConfirmationLetterFile()}
            error={confirmationLetterAttachmentError}
            placeholder="نامه احراز شرایط درج نماد به سازمان"
          />
          <Upload
            className="2xl:col-span-4 xl:col-span-5 lg:col-span-6 md:col-span-12 sm:col-span-12 lg:my-2 md:my-2"
            onChange={(file: any) => onChangeSessionFile(file)}
            value={symbolAndCodeAttachment?.fileName}
            href={symbolAndCodeAttachment?.link}
            name="symbolAndCodeFile"
            onDelete={() => onRemoveSymbolAndCodeFile()}
            error={symbolAndCodeAttachmentError}
            placeholder="صورت جلسه کد و نماد"
          />
          <div className="2xl:col-span-4 xl:col-span-2 lg:col-span-12 md:col-span-12 sm:col-span-12 items-center justify-start">
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
            data={
              ListData?.dossierDataSymbolAndCodeResolutionInfoResult?.length > 0
                ? ListData?.dossierDataSymbolAndCodeResolutionInfoResult
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
export default withAlert(DossierFileCodeAndSymbolMeetingModal);
