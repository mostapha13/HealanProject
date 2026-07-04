//API controller: DossierOtherAcceptance
//Component name: سایر مدارک و مستندات بخش پذیرش

import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { useStates, useEffect, useState, useSearchParams } from '@tse/utils';
import { Table, SmartTable } from '@tse/components/organism';
import { Button, Upload, TextField } from '@tse/components/atoms';
import { HeaderTypes } from '@tse/types';
import {
  modalFindApi,
  modalSaveApi,
  modalConfirmApi,
  modalRejectApi,
  OtherDocumentsRadioButtonApi,
} from 'apps/cash-market/src/Controller/Listing/Modal';
import { Icon } from '@tse/components/atoms';
import { ListingModalComponent } from '../../atoms/ListingModalComponent';
import { uploadFile, downloadFileApi } from 'apps/cash-market/src/Controller';
import { downloadFile } from '@tse/tools';
import { DownloadOutlined } from '@mui/icons-material';
import { Radio } from 'antd';
import { Input } from 'antd';
const { TextArea } = Input;

export function DossierFileOtherDocumentsModal(props: any) {
  const { isOpen, modalData, onChangeState, onAlert, handleGetParentApi } =
    props;

  const initialState = {
    ListData: [],
    isShowChat: false,
    fileUpload: null,
    fileUploadError: false,
    radioValue: 'FinancialMajorShareholder',
    radioButtonData: [],
    description: '',
    descriptionError: false,
  };

  const [state, setState] = useStates<any>(initialState);
  const {
    ListData,
    isShowChat,
    fileUpload,
    fileUploadError,
    radioValue,
    radioButtonData,
    description,
    descriptionError,
  } = state;
  const [searchParams] = useSearchParams();

  const dossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;

  useEffect(() => {
    if (modalData != null && isOpen) {
      handleGetList();
      handleGetRadioButtonData();
    }
  }, [modalData]);

  const handleGetRadioButtonData = () => {
    OtherDocumentsRadioButtonApi({
      onSuccess: (res: any) => setState({ radioButtonData: res }),
      onFail,
    });
  };

  const onAcceptDossierTable = (id: any) => {
    const data = { dossierDataOtherAcceptanceId: id };
    modalConfirmApi({
      data,
      url: modalData?.confirmApiName,
      onSuccess: (res: any) => handleGetList(),
      onFail,
    });
  };

  const onRejectDossierTable = (id: any) => {
    const data = { dossierDataOtherAcceptanceId: id };
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
      title: 'نوع مدارک',
      dataIndex: 'otherAcceptanceTypeName',
      key: 'otherAcceptanceTypeName',
    },
    {
      title: 'توضیحات',
      dataIndex: 'description',
      key: 'description',
      render: (item: any, record: any) => (item != null ? item : '__'),
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
                      onAcceptDossierTable(item?.dossierDataOtherAcceptanceId)
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
                      onRejectDossierTable(item?.dossierDataOtherAcceptanceId)
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
      description: '',
      fileUpload: null,
      radioValue: 'FinancialMajorShareholder',
      fileUploadError: false,
      descriptionError: false,
    });
    handleGetList();
  };

  const onAddRow = () => {
    if (description && fileUpload?.fileId && radioValue) {
      const data = {
        dossierId,
        submenuId: modalData?.submenuId,
        attachmentId: fileUpload?.fileId,
        otherAcceptanceTypeId: radioValue,
        description,
      };
      modalSaveApi({
        url: modalData?.saveApiName,
        data,
        onSuccess: (res: any) => onSuccessAddRow(),
        onFail,
      });
    } else {
      fileUpload == null && setState({fileUploadError: true});
      !description && setState({descriptionError: true});
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
      description: "",
      descriptionError: false,
      fileUpload: null,
      fileUploadError: false,
      radioValue: 'FinancialMajorShareholder',
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


  const handleRadioButtonChange = (e: any) => {
    setState({ radioValue: e?.target?.value });
  };

  const onChangeTextArea = (e: any) => {
    setState({ description: e?.target?.value, descriptionError: false });
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
      lastValue={ListData?.dossierOtherAcceptanceInfoResult?.[0]?.otherAcceptanceTypeName}
    >
      <div
        className={` ${
          isShowChat
            ? '2xl:col-span-8  xl:col-span-8 lg:col-span-12 md:col-span-12'
            : 'col-span-12'
        } grid grid-cols-12  items-end justify-center bg-white rounded-2xl p-6 `}
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
          <div className="2xl:col-span-12 xl:col-span-10 lg:col-span-8 md:col-span-6 pb-10">
            <Radio.Group
              onChange={handleRadioButtonChange}
              value={radioValue}
              style={{ marginBottom: 5 }}
            >
              {radioButtonData?.map((item: any) => (
                <Radio className="text-extratiny font-bold" value={item?.name}>
                  {item?.displayName}
                </Radio>
              ))}
            </Radio.Group>
          </div>
          <div className="col-span-12 grid grid-cols-12 gap-4">
            <Upload
              className="2xl:col-span-6 xl:col-span-8 lg:col-span-12 md:col-span-12"
              onChange={(file: any) => onChangeFile(file)}
              value={fileUpload?.fileName}
              href={fileUpload?.link}
              name="fileOtherDocuments"
              onDelete={() => onRemoveFile()}
              error={fileUploadError}
            />
            <div className="col-span-12 items-center justify-center rounded-2xl mt-10">
              <TextArea
                className={`${
                  descriptionError ? 'border border-red' : 'border-gray'
                }`}
                placeholder="توضیحات"
                rows={4}
                onChange={onChangeTextArea}
                value={description}
                // maxLength={60}
              />
            </div>
            <div className="col-span-12 md:m-0 flex justify-end gap-y-2">
              <Button
                className="w-32 h-9 bg-listingModalRegisterButton text-white "
                onClick={onAddRow}
              >
                ثبت
              </Button>
            </div>
          </div>
        </div>
        <div className="col-span-12 mt-32">
          <SmartTable
            columns={tableHeader}
            data={
              ListData?.dossierOtherAcceptanceInfoResult?.length > 0
                ? ListData?.dossierOtherAcceptanceInfoResult
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
export default withAlert(DossierFileOtherDocumentsModal);
