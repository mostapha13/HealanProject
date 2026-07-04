import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import { SmartTable, Table } from '@tse/components/organism';
import { Button, Upload } from '@tse/components/atoms';
import { HeaderTypes } from '@tse/types';
import {
  findDossierFile,
  confirmDossierFile,
  rejectDossierFile,
  saveDossierFile,
} from 'apps/cash-market/src/Controller/Listing/Modal';
import { Icon } from '@tse/components/atoms';
import { convertDateToJalali, downloadFile } from '@tse/tools';
import { downloadFileApi, uploadFile } from 'apps/cash-market/src/Controller';
import { DownloadOutlined } from '@mui/icons-material';
import { ListingModalComponent } from 'apps/cash-market/src/components/atoms/ListingModalComponent';
import useLoadDastineScript from 'apps/cash-market/src/components/hooks/DastineHook';
import { SelectCertificateFromTokenByUIFun } from 'apps/cash-market/src/utils/digitalSignature';

export function DossierFileModal(props: any) {
  const { isOpen, modalData, onChangeState, onAlert, handleGetParentApi } =
    props;

  const initialState = {
    fileUpload: null,
    fileUploadError: false,
    ListData: [],
    isShowChat: false,
    signatureLoading: false,
  };

  const [state, setState] = useStates<any>(initialState);
  const { fileUpload, ListData, isShowChat, signatureLoading } = state;
  const [searchParams] = useSearchParams();
  const dossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;
  const tableHeader: HeaderTypes[] = [
    {
      title: 'فایل',
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
                      onAcceptDossierTable(item?.dossierDataFileId)
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
                      onRejectDossierTable(item?.dossierDataFileId)
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
    ...(ListData?.accessSignature
      ? [
          {
            title: 'امضای دیجیتال',
            dataIndex: 'attachment',
            key: 'attachment',
            render: (item: any, record: any) => {
              return signatureLoading ? (
                <span>در حال انجام فرآیند امضا</span>
              ) : (
                <Icon
                  onClick={() => SelectCertificateFromToken(item)}
                  name="icon-File-signaturee"
                  classname="text-black text-lg cursor-pointer"
                />
              );
            },
          },
          {
            title: 'امضاکنندگان',
            dataIndex: 'attachment',
            key: 'attachment',
            render: (item: any, record: any) => <span></span>,
          },
        ]
      : []),
  ];
  useEffect(() => {
    if (modalData != null && isOpen) {
      handleGetFileList();
    }
  }, [modalData]);

  const onFail = (error: any) => {
    onAlert(error);
  };

  const handleGetFileList = () => {
    const dataQuery = { dossierId, submenuId: modalData?.submenuId };
    findDossierFile({
      url: modalData?.findApiName,
      data: dataQuery,
      onSuccess: (res: any) => onSuccessGetFileList(res),
      onFail,
    });
  };
  const onSuccessGetFileList = (res: any) => {
    setState({ ListData: res });
  };

  const onSaveFile = () => {
    if (fileUpload) {
      const data = {
        dossierId,
        submenuId: modalData?.submenuId,
        attachmentId: fileUpload?.fileId,
      };
      saveDossierFile({
        url: modalData?.saveApiName,
        data,
        onSuccess: (res: any) => onSuccessSaveFile(),
        onFail,
      });
    } else {
      !fileUpload && setErrorMessage('fileUpload');
    }
  };

  const onSuccessSaveFile = () => {
    setState({ fileUpload: null });
    handleGetFileList();
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
  const handleDownload = (data: any) => {
    downloadFileApi({
      data: data?.fileId,
      onSuccess: (res: any) => downloadExportDoc(res, data?.fileName),
      onFail,
    });
  };
  const downloadExportDoc = (data: any, name: any) => {
    if (data != null) {
      downloadFile(data, name);
    }
  };
  const onAcceptDossierTable = (id: any) => {
    const data = { dossierDataFileId: id };
    confirmDossierFile({
      data,
      url: modalData?.confirmApiName,
      onSuccess: (res: any) => handleGetFileList(),
      onFail,
    });
  };

  const onRejectDossierTable = (id: any) => {
    const data = { dossierDataFileId: id };
    rejectDossierFile({
      data,
      url: modalData?.rejectApiName,
      onSuccess: (res: any) => handleGetFileList(),
      onFail,
    });
  };
  const onCloseModal = () => {
    setState({ fileUploadError: false, fileUpload: null, isShowChat: false });
    onChangeState(modalData?.componentName, false);
  };

  const onSuccessSubmit = () => {
    setState({ fileUploadError: false, fileUpload: null });
    handleGetParentApi(modalData);
    onCloseModal();
  };

  const setErrorMessage = (key: string) => {
    const errorMessage = true;
    setState({ [`${key}Error`]: errorMessage });
  };

  useLoadDastineScript(isOpen && ListData?.accessSignature);
  const SelectCertificateFromToken = async (att: any) => {
    setState({ signatureLoading: true });
    try {
      const result = await SelectCertificateFromTokenByUIFun({
        att,
        onAlert,
        dossierId,
        modalData,
      });

      if (result) {
        setState({ signatureLoading: false });
        console.log('result:', result);
      } else {
        setState({ signatureLoading: false });
        console.log('faillllll');
      }
    } catch (err) {
      setState({ signatureLoading: false });
      console.error('خطا در SelectCertificateFromToken:', err);
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
    >
      <div
        className={` ${
          isShowChat
            ? '2xl:col-span-8  xl:col-span-8 lg:col-span-12 md:col-span-12'
            : 'col-span-12'
        } grid grid-cols-12  items-center justify-center bg-white rounded-2xl p-6 `}
      >
        <div className="flex col-span-12 justify-end px-2">
          {ListData?.dossierStateTypes?.map((item: any) => {
            return (
              <span className="font-bold border-b-2 px-2 mx-1">
                {item?.dossierStateTypeName}
              </span>
            );
          })}
          <Icon
            name="icon-chat"
            classname=" text-lg cursor-pointer px-2"
            onClick={() => setState({ isShowChat: !isShowChat })}
          />
        </div>
        <div className="2xl:col-span-4 xl:col-span-4 lg:col-span-6 md:col-span-12 items-center justify-center rounded-2xl my-10">
          <Upload
            onChange={(file: any) => onChangeFile(file)}
            value={fileUpload?.fileName}
            href={fileUpload?.link}
            name="modalFile"
            onDelete={() => onRemoveFile()}
            error={state?.fileUploadError}
          />
        </div>

        <div className="2xl:col-span-8 xl:col-span-8 lg:col-span-6 md:col-span-12 items-center justify-start">
          <Button
            className="w-32 h-9 bg-listingModalRegisterButton text-white m-4 lg:m-0 md:m-0"
            onClick={onSaveFile}
          >
            ثبت
          </Button>
        </div>
        <div className="col-span-12 mt-5">
          <SmartTable
            columns={tableHeader}
            data={
              ListData?.dossierFileInfoResult?.length > 0
                ? ListData?.dossierFileInfoResult
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
export default withAlert(DossierFileModal);
