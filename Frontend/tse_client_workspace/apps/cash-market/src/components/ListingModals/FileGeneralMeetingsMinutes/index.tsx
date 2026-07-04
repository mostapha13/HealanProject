//API controller: DossierGeneralMeeting
//Component name: صورت جلسه مجامع عمومی دو سال اخیر روزنامه های رسمی مربوطه

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
  generalMeetingSelectApi,
  generalMeetingRadioButtonApi,
} from 'apps/cash-market/src/Controller/Listing/Modal';
import { Icon } from '@tse/components/atoms';
import { ListingModalComponent } from '../../atoms/ListingModalComponent';
import { DatePicker } from '@tse/components/molecules';
import { uploadFile, downloadFileApi } from 'apps/cash-market/src/Controller';
import { convertDateToJalali, downloadFile } from '@tse/tools';
import { DownloadOutlined } from '@mui/icons-material';
import { Modal, Popconfirm, Radio } from 'antd';
import { modalListComponentApi } from 'apps/cash-market/src/Controller/Listing/Modal';

export function DossierFileGeneralMeetingsMinutesModal(props: any) {
  const { isOpen, modalData, onChangeState, onAlert, handleGetParentApi } =
    props;

  const initialState = {
    ListData: [],
    isShowChat: false,
    fileUpload: null,
    fileUploadError: false,
    date: '',
    dateError: false,
    radioValue: 'Mettings',
    selectedValue: '',
    selectError: false,
    meetingSelectData: [],
    meetingRadioData: [],
  };

  const [state, setState] = useStates<any>(initialState);
  const {
    ListData,
    isShowChat,
    fileUpload,
    fileUploadError,
    date,
    dateError,
    radioValue,
    selectedValue,
    selectError,
    meetingSelectData,
    meetingRadioData,
  } = state;
  const [searchParams] = useSearchParams();
  const dossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;

  useEffect(() => {
    if (modalData != null && isOpen) {
      handleGetList();
      handleGetSelectData('');
      handleGetRadioButtonData();
    }
  }, [modalData]);

  const handleGetSelectData = (filterText: any) => {
    const data = {
      FilterText: filterText,
      PageNumber: 1,
      PageSize: 20,
    };
    generalMeetingSelectApi({
      data,
      url: modalData?.listApiName,
      onSuccess: (res: any) => setState({ meetingSelectData: res }),
      onFail,
    });
  };

  const handleGetRadioButtonData = () => {
    const data = {};
    generalMeetingRadioButtonApi({
      data,
      onSuccess: (res: any) => setState({ meetingRadioData: res }),
      onFail,
    });
  };

  const onAcceptDossierTable = (id: any) => {
    const data = { dossierDataGeneralMeetingId: id };
    modalConfirmApi({
      data,
      url: modalData?.confirmApiName,
      onSuccess: (res: any) => handleGetList(),
      onFail,
    });
  };

  const onRejectDossierTable = (id: any) => {
    const data = { dossierDataGeneralMeetingId: id };
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
      title: 'نوع درخواست',
      dataIndex: 'generalMeetingTypeName',
      key: 'generalMeetingTypeName',
      // render: (item: any, record: any) => {
      //   if (record?.generalMeetingTypeId == 'Mettings') {
      //     return (
      //       <>
      //         <a onClick={() => handleDownload(item)}>
      //           <span>دانلود فایل</span>
      //           <DownloadOutlined className="text-xl mx-2" />
      //         </a>
      //       </>
      //     );
      //   } else {
      //     return <span>_</span>;
      //   }
      // },
    },
    {
      title: 'نوع صورت جلسه',
      dataIndex: 'amountName',
      key: 'amountName',
    },
    {
      title: 'تاریخ صورت جلسه',
      dataIndex: 'generalMeetingDate',
      key: 'generalMeetingDate',
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

      // if (record?.generalMeetingTypeId == 'Mettings') {
      //   return (
      //     <>
      //       <a onClick={() => handleDownload(item)}>
      //         <span>دانلود فایل</span>
      //         <DownloadOutlined className="text-xl mx-2" />
      //       </a>
      //     </>
      //   );
      // } else {
      //   return <span>_</span>;
      // }

      className: 'col-span-2',
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
                      onAcceptDossierTable(item?.dossierDataGeneralMeetingId)
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
                      onRejectDossierTable(item?.dossierDataGeneralMeetingId)
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
            title: 'امضا کنندگان ',
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

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSuccessAddRow = () => {
    setState({
      date: '',
      fileUpload: null,
      selectedValue: '',
      radioValue: 'Mettings',
    });
    handleGetList();
  };

  const onAddRow = () => {
    if (date && fileUpload?.fileId && selectedValue && radioValue) {
      const data = {
        dossierId,
        submenuId: modalData?.submenuId,
        attachmentId: fileUpload?.fileId,
        generalMeetingTypeId: radioValue,
        amountId: selectedValue?.name,
        amountName: selectedValue?.displayName,
        generalMeetingDate: date,
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
        selectError: true,
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
      selectError: false,
      selectedValue: '',
      radioValue: 'Mettings',
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

  const handleRadioButtonChange = (e: any) => {
    setState({ radioValue: e?.target?.value });
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
      lastValue={`${
        ListData?.dossierGeneralMeetingInfoResult?.[0]?.amountName
      } - ${convertDateToJalali(
        ListData?.dossierGeneralMeetingInfoResult?.[0]?.generalMeetingDate
      )} `}
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
          <div className="col-span-12 pb-10">
            <Radio.Group
              onChange={handleRadioButtonChange}
              value={radioValue}
              style={{ marginBottom: 5, display: 'flex' }}
            >
              {meetingRadioData?.map((item: any) => (
                <Radio className="text-extratiny font-bold" value={item?.name}>
                  {item?.displayName}
                </Radio>
              ))}
            </Radio.Group>
          </div>
          <AntdSelectSearch
            label="نوع صورت جلسه"
            className="2xl:col-span-3 xl:col-span-4 lg:col-span-6 md:col-span-12 sm:col-span-12  col-span-6"
            data={meetingSelectData}
            onChange={(value: any) => {
              if (value?.displayName != undefined) {
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
            showKey="displayName"
            idKey="name"
            value={selectedValue}
            error={selectError}
          />
          <div className="2xl:col-span-3 xl:col-span-4 lg:col-span-6 md:col-span-12 sm:col-span-12 ">
            <DatePicker
              //  className="col-span-6"
              // parentClassName="!w-[70%]"
              label="تاریخ صورت جلسه"
              value={date}
              onChange={(value: any) => onChangeDate(value)}
              onClearDate={() => onChangeDate('')}
              required
              error={dateError}
            />
          </div>
          <Upload
            className="2xl:col-span-3 xl:col-span-4 lg:col-span-6 md:col-span-12 sm:col-span-12 "
            onChange={(file: any) => onChangeFile(file)}
            value={fileUpload?.fileName}
            href={fileUpload?.link}
            name="fileGeneralMeeting"
            onDelete={() => onRemoveFile()}
            error={fileUploadError}
          />
          <div className=" 2xl:col-span-3 xl:col-span-4 lg:col-span-6 md:col-span-12 sm:col-span-12  justify-start mx-4">
            <Button
              className="w-32 h-9 bg-listingModalRegisterButton text-white "
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
              ListData?.dossierGeneralMeetingInfoResult?.length > 0
                ? ListData?.dossierGeneralMeetingInfoResult
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
export default withAlert(DossierFileGeneralMeetingsMinutesModal);
