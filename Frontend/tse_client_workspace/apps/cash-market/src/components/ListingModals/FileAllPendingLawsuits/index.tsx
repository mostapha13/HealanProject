//API controller: DossierAllLegalProceeding
//Component name: کلیه ی دعاوی در جریان و مختومه

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
  allLegalProceedingType,
} from 'apps/cash-market/src/Controller/Listing/Modal';
import { Icon, TextField } from '@tse/components/atoms';
import { convertDateToJalali, downloadFile } from '@tse/tools';
import { ListingModalComponent } from 'apps/cash-market/src/components/atoms/ListingModalComponent';
import { downloadFileApi, uploadFile } from 'apps/cash-market/src/Controller';
import { DatePicker } from '@tse/components/molecules';
import { Radio, RadioChangeEvent } from 'antd';
import { DownloadOutlined } from '@mui/icons-material';

export function DossierFileAllPendingLawsuitsModal(props: any) {
  const { isOpen, modalData, onChangeState, onAlert, handleGetParentApi } =
    props;

  const initialState = {
    ListData: [],
    isShowChat: false,
    radioValue: 'AllLegalProceedingList',
    fileValue: null,
    fileValueError: false,
    textValue: '',
    textValueError: false,
    radioList: [],
  };

  const [state, setState] = useStates<any>(initialState);
  const { ListData, textValue, fileValue, isShowChat, radioValue, radioList } =
    state;
  const [searchParams] = useSearchParams();
  const dossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;

  const tableHeader: HeaderTypes[] = [
    {
      title: 'نوع',
      dataIndex: 'allLegalProceedingTypeName',
      key: 'allLegalProceedingTypeName',
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
    {
      title: 'نام مدرک',
      dataIndex: 'documentName',
      key: 'documentName',
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
                      onAcceptTable(item?.dossierDataAllLegalProceedingId)
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
                      onRejectTable(item?.dossierDataAllLegalProceedingId)
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
      handleGetAllLegalProceedingType();
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
    if (fileValue) {
      if (radioValue == 'AllLegalProceedingDocument' && textValue == '') {
        !textValue && setErrorMessage('textValue');
      } else {
        const data = {
          dossierId,
          submenuId: modalData?.submenuId,
          attachmentId: fileValue?.fileId,
          allLegalProceedingTypeId: radioValue,
          documentName: textValue,
        };
        modalSaveApi({
          url: modalData?.saveApiName,
          data,
          onSuccess: (res: any) => onSuccessSave(),
          onFail,
        });
      }
    } else {
      !fileValue && setErrorMessage('fileValue');
    }
  };

  const onSuccessSave = () => {
    setState({
      textValue: '',
      fileValue: null,
      radioValue: 'AllLegalProceedingList',
    });
    handleGetList();
  };

  const onAcceptTable = (id: any) => {
    const data = { dossierDataAllLegalProceedingId: id };
    modalConfirmApi({
      data,
      url: modalData?.confirmApiName,
      onSuccess: (res: any) => handleGetList(),
      onFail,
    });
  };

  const onRejectTable = (id: any) => {
    const data = { dossierDataAllLegalProceedingId: id };
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
      textValue: '',
      fileValue: null,
      textValueError: false,
      radioValue: 'AllLegalProceedingList',
    });
    onChangeState(modalData?.componentName, false);
  };

  const onSuccessSubmit = () => {
    setState({
      fileValueError: false,
      textValue: '',
      fileValue: null,
      textValueError: false,
      radioValue: 'AllLegalProceedingList',
    });
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
  const handleGetAllLegalProceedingType = () => {
    allLegalProceedingType({
      onSuccess: (res: any) => setState({ radioList: res }),
      onFail,
    });
  };
  const handleRadioChange = (e: RadioChangeEvent) => {
    setState({
      radioValue: e.target.value,
      textValue: '',
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
      lastValue={
        ListData?.dossierAllLegalProceedingInfoResult?.[0]
          ?.allLegalProceedingTypeName
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
            {radioValue == 'AllLegalProceedingDocument' && (
              <TextField
                label="نام مدرک"
                className=" 2xl:col-span-3 xl:col-span-4 lg:col-span-6 md:col-span-12 sm:col-span-12"
                value={textValue}
                onChange={(value: any) =>
                  setState({
                    textValue: value,
                    textValueError: false,
                  })
                }
                errorMessage={state?.textValueError}
              />
            )}
            <div className=" 2xl:col-span-3 xl:col-span-4 lg:col-span-6 md:col-span-12 sm:col-span-12 items-center justify-center rounded-2xl my-2">
              <Upload
                onChange={(file: any) => onChangeFile(file)}
                value={fileValue?.fileName}
                href={fileValue?.link}
                name="modalFileAllLawsuits"
                onDelete={() => onRemoveFile()}
                error={state?.fileValueError}
              />
            </div>
            <div className="2xl:col-span-6  xl:col-span-4 lg:col-span-12 md:col-span-12 sm:col-span-12 flex items-center justify-start mx-4 ">
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
              ListData?.dossierAllLegalProceedingInfoResult?.length > 0
                ? ListData?.dossierAllLegalProceedingInfoResult
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
export default withAlert(DossierFileAllPendingLawsuitsModal);
