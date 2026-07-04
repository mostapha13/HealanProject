import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { useStates, useEffect, useState, useSearchParams } from '@tse/utils';
import { Table } from '@tse/components/organism';
import { Button, TextField, Upload } from '@tse/components/atoms';
import { HeaderTypes } from '@tse/types';
import {
  findDossierText,
  saveDossierText,
  confirmDossierText,
  rejectDossierText,
} from 'apps/cash-market/src/Controller/Listing/Modal';
import { Icon } from '@tse/components/atoms';
import { ListingModalComponent } from 'apps/cash-market/src/components/atoms/ListingModalComponent';
import { uploadFile, downloadFileApi } from 'apps/cash-market/src/Controller';
import { downloadFile } from '@tse/tools';
import { DownloadOutlined } from '@mui/icons-material';

export function DossierCompanyStockCertificateImageModal(props: any) {
  const { isOpen, modalData, onChangeState, onAlert, handleGetParentApi } =
    props;

  const initialState = {
    ListData: '',
    isShowChat: false,
    fileUpload: null,
    fileUploadError: false,
    shareholderName: '',
    shareholderNameError: false,
    shareholdersCount: '',
    shareholdersCountError: false,
    shareholderPercent: '',
    shareholderPercentError: false,
  };

  const [state, setState] = useStates<any>(initialState);
  const {
    ListData,
    isShowChat,
    fileUpload,
    fileUploadError,
    shareholderName,
    shareholderNameError,
    shareholdersCount,
    shareholdersCountError,
    shareholderPercent,
    shareholderPercentError,
  } = state;
  const [searchParams] = useSearchParams();
  const dossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;

  useEffect(() => {
    if (modalData != null && isOpen) {
      handleGateDossierText();
    }
  }, [modalData]);

  const onAcceptDossierTable = (id: any) => {
    const data = { dossierDataStockCertificateId: id };

    confirmDossierText({
      data,
      url: modalData?.confirmApiName,
      onSuccess: (res: any) => handleGateDossierText(),
      onFail,
    });
  };

  const onRejectDossierTable = (id: any) => {
    const data = { dossierDataStockCertificateId: id };
    rejectDossierText({
      data,
      url: modalData?.rejectApiName,
      onSuccess: (res: any) => handleGateDossierText(),
      onFail,
    });
  };

  const downloadExportDoc = (data: any, name: any) => {
    if (data != null) {
      downloadFile(data, name);
    }
  };

  const handleDownload = (data: any) => {
    downloadFileApi({
      data: data?.fileId,
      onSuccess: (res: any) => downloadExportDoc(res, data?.fileName),
      onFail: (err: any) => console.log('onFail', err),
    });
  };

  const licenseTableHeader: HeaderTypes[] = [
    {
      title: 'نام سهامدار',
      dataIndex: 'stockHolderName',
      key: 'stockHolderName',
      className: 'col-span-2',
    },
    {
      title: 'تعداد سهام',
      dataIndex: 'stockHolderCount',
      key: 'stockHolderCount',
      className: 'col-span-2',
    },
    {
      title: 'درصد سهامداری',
      dataIndex: 'stockHolderPercent',
      key: 'stockHolderPercent',
      className: 'col-span-2',
      render: (item: any) => <span>{`%${item}`}</span>,
    },
    {
      title: 'فایل پیوست',
      dataIndex: 'attachment',
      key: 'attachment',
      render: (item: any) => (
        <a onClick={() => handleDownload(item)}>
          <span>دانلود فایل</span>
          <DownloadOutlined className="text-xl mx-2" />
        </a>
      ),
      className: `${ListData?.accessAction ? 'col-span-2' : 'col-span-3'}`,
    },
    {
      title: 'اعمال وضعیت',
      dataIndex: 'action',
      key: 'action',
      className: 'col-span-2 !justify-center',
      render: (_: any, item: any) => {
        return (
          <div className="flex flex-row items-center flitems-center justify-center">
            <Button
              className="w-16 h-7  bg-dossierModalTableConfirmButton text-white ml-2"
              onClick={() =>
                onAcceptDossierTable(item?.dossierDataStockCertificateId)
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
                onRejectDossierTable(item?.dossierDataStockCertificateId)
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
    {
      title: 'وضعیت',
      dataIndex: 'dossierStateTypeId',
      key: 'dossierStateTypeId',
      className: `${ListData?.accessAction ? 'col-span-1' : 'col-span-2'}`,
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

  const onSuccessSave = () => {
    setState({
      fileUpload: null,
      shareholderName: '',
      shareholderPercent: '',
      shareholdersCount: '',
    });
    handleGateDossierText();
  };

  const onAddRow = () => {
    if (
      shareholderName &&
      shareholderPercent &&
      shareholdersCount &&
      fileUpload?.fileId
    ) {
      const data = {
        dossierId,
        submenuId: modalData?.submenuId,
        attachmentId: fileUpload?.fileId,
        stockHolderName: shareholderName,
        stockHolderPercent: shareholderPercent,
        stockHolderCount: shareholdersCount,
      };
      saveDossierText({
        url: modalData?.saveApiName,
        data,
        onSuccess: (res: any) => onSuccessSave(),
        onFail,
      });
    } else {
      !shareholderName && setState({ shareholderNameError: true });
      !shareholderPercent && setState({ shareholderPercentError: true });
      !shareholdersCount && setState({ shareholdersCountError: true });
      !fileUpload && setState({ fileUploadError: true });
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
      fileUpload: null,
      shareholderName: '',
      shareholderPercent: '',
      shareholdersCount: '',
      shareholderNameError: false,
      shareholderPercentError: false,
      fileUploadError: false,
      shareholdersCountError: false,
    });
  };

  const onSuccessSubmit = () => {
    handleGetParentApi(modalData);
    onCloseModal();
  };
  const onChangeFile = (e: any) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) =>
        setState({ fileUpload: res, fileUploadError: false }),
      onFail,
    });
  };

  const onRemoveFile = () => {
    setState({
      fileUpload: null,
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
      lastValue={`${ListData?.dossierStockCertificateInfoResult?.[0]?.stockHolderName} _ ${ListData?.dossierStockCertificateInfoResult?.[0]?.stockHolderPercent}%`}
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
        <div className="col-span-12 grid grid-cols-12 justify-center rounded-2xl my-10 gap-4 ">
          <TextField
            label="نام سهامدار"
            className="2xl:col-span-3 xl:col-span-6 lg:col-span-6 md:col-span-12"
            value={shareholderName}
            onChange={(value: any) =>
              setState({
                shareholderName: value,
                shareholderNameError: false,
              })
            }
            required
            errorMessage={shareholderNameError}
            // type="Text"
          />

          <TextField
            label="تعدادسهام"
            className="2xl:col-span-3 xl:col-span-6 lg:col-span-6 md:col-span-12"
            value={shareholdersCount}
            onChange={(value: any) =>
              setState({
                shareholdersCount: value,
                shareholdersCountError: false,
              })
            }
            required
            errorMessage={shareholdersCountError}
            type="numeric"
          />

          <TextField
            label="درصد سهام داری"
            className="2xl:col-span-3 xl:col-span-6 lg:col-span-6 md:col-span-12"
            value={shareholderPercent}
            onChange={(value: any) =>
              setState({
                shareholderPercent: value,
                shareholderPercentError: false,
              })
            }
            required
            errorMessage={shareholderPercentError}
            type="number"
            max={100}
          />

          <Upload
            className="2xl:col-span-3 xl:col-span-6 lg:col-span-6 md:col-span-12"
            onChange={(file: any) => onChangeFile(file)}
            value={fileUpload?.fileName}
            href={fileUpload?.link}
            name="fileComapanyShareCertificate"
            onDelete={() => onRemoveFile()}
            error={fileUploadError}
          />
        </div>

        <div className="2xl:col-span-8 xl:col-span-8 lg:col-span-6 md:col-span-12 items-center justify-start">
          <Button
            className="w-32 h-9  bg-listingModalRegisterButton text-white m-4"
            onClick={onAddRow}
          >
            ثبت
          </Button>
        </div>
        <div className="col-span-12 mt-5">
          <Table
            columns={filteredColumn}
            className="col-span-12 grid grid-cols-12 "
            data={
              ListData?.dossierStockCertificateInfoResult?.length > 0
                ? ListData?.dossierStockCertificateInfoResult
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
export default withAlert(DossierCompanyStockCertificateImageModal);
