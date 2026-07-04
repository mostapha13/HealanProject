//API controller: DossierIntroductorySession
//Component name: برگزاری جلسه معارفه توسط شرکت

import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import { Table, SmartTable } from '@tse/components/organism';
import { Button, TextField } from '@tse/components/atoms';
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
import { convertDateToJalali, downloadFile } from '@tse/tools';
import { DownloadOutlined } from '@mui/icons-material';

export function DossierFileIntroductionSessionModal(props: any) {
  const { isOpen, modalData, onChangeState, onAlert, handleGetParentApi } =
    props;

  const initialState = {
    ListData: [],
    isShowChat: false,
    startDate: '',
    startDateError: false,
    endDate: '',
    endDateError: false,
    videoFileLink: '',
    imageFileLink: '',
    streamingLink: '',
    videoFileLinkError: false,
    imageFileLinkError: false,
    streamingLinkError: false,
  };

  const [state, setState] = useStates<any>(initialState);
  const {
    ListData,
    isShowChat,
    startDate,
    startDateError,
    endDate,
    endDateError,
    videoFileLink,
    imageFileLink,
    streamingLink,
    videoFileLinkError,
    imageFileLinkError,
    streamingLinkError,
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
    const data = { dossierDataIntroductorySessionId: id };
    modalConfirmApi({
      data,
      url: modalData?.confirmApiName,
      onSuccess: (res: any) => handleGetList(),
      onFail,
    });
  };

  const onRejectDossierTable = (id: any) => {
    const data = { dossierDataIntroductorySessionId: id };
    modalRejectApi({
      data,
      url: modalData?.rejectApiName,
      onSuccess: (res: any) => handleGetList(),
      onFail,
    });
  };

  const tableHeader: HeaderTypes[] = [
    {
      title: 'تاریخ شروع',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (item: any) => convertDateToJalali(item),
    },
    {
      title: 'تاریخ پایان',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (item: any) => convertDateToJalali(item),
    },
    {
      title: 'لینک فایل ویدیو',
      dataIndex: 'videoFileLink',
      key: 'videoFileLink',
      render: (item: any) => (
        <a href={item} target="_blank" rel="noreferrer">
          {item}
        </a>
      ),
    },
    {
      title: 'لینک فایل تصویر ویدیو',
      dataIndex: 'imageFileLink',
      key: 'imageFileLink',
      render: (item: any) => (
        <a href={item} target="_blank" rel="noreferrer">
          {item}
        </a>
      ),
    },
    {
      title: 'لینک پخش زنده',
      dataIndex: 'streamingLink',
      key: 'streamingLink',
      render: (item: any) => (
        <a href={item} target="_blank" rel="noreferrer">
          {item}
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
                        item?.dossierDataIntroductorySessionId
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
                        item?.dossierDataIntroductorySessionId
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
      startDate: '',
      startDateError: false,
      endDate: '',
      endDateError: false,
      videoFileLink: '',
      videoFileLinkError: false,
      imageFileLink: '',
      imageFileLinkError: false,
      streamingLink: '',
      streamingLinkError: false,
    });
    handleGetList();
  };

  const onAddRow = () => {
    if (
      startDate &&
      endDate &&
      videoFileLink &&
      imageFileLink &&
      streamingLink
    ) {
      const data = {
        dossierId,
        submenuId: modalData?.submenuId,
        startDate,
        endDate,
        videoFileLink,
        imageFileLink,
        streamingLink,
      };
      modalSaveApi({
        url: modalData?.saveApiName,
        data,
        onSuccess: (res: any) => onSuccessAddRow(),
        onFail,
      });
    } else {
      !startDate && setState({ startDateError: true });
      !endDate && setState({ endDateError: true });
      !videoFileLink && setState({ videoFileLinkError: true });
      !imageFileLink && setState({ imageFileLinkError: true });
      !streamingLink && setState({ streamingLinkError: true });
    }
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
      startDate: '',
      startDateError: false,
      endDate: '',
      endDateError: false,
      videoFileLink: '',
      videoFileLinkError: false,
      imageFileLink: '',
      imageFileLinkError: false,
      streamingLink: '',
      streamingLinkError: false,
    });
  };

  const onSuccessSubmit = () => {
    handleGetParentApi(modalData);
    onCloseModal();
  };

  const onChangeDate = (value: any, key: any) => {
    setState({ [key]: value, [`${key}Error`]: false });
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
        ListData?.dossierDataIntroductorySessionInfoResult?.[0]?.endDate
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
        <div className="col-span-12 grid grid-cols-12 gap-4 py-4">
          <div className="2xl:col-span-6 xl:col-span-6 lg:col-span-12 md:col-span-12 sm:col-span-12">
            <DatePicker
              className=""
              // parentClassName="!w-[70%]"
              label="تاریخ شروع"
              value={startDate}
              onChange={(value: any) => onChangeDate(value, 'startDate')}
              onClearDate={() => onChangeDate('', 'startDate')}
              required
              error={startDateError}
            />
          </div>
          <div className="2xl:col-span-6 xl:col-span-6 lg:col-span-12 md:col-span-12 sm:col-span-12">
            <DatePicker
              className=""
              // parentClassName="!w-[70%]"
              label="تاریخ پایان"
              value={endDate}
              onChange={(value: any) => onChangeDate(value, 'endDate')}
              onClearDate={() => onChangeDate('', 'endDate')}
              required
              error={endDateError}
            />
          </div>
        </div>

        <div className="col-span-12 grid grid-cols-12 gap-4">
          <TextField
            label="لینک فایل ویدیو"
            className="2xl:col-span-6 xl:col-span-6 lg:col-span-12 md:col-span-12 sm:col-span-12"
            value={videoFileLink}
            onChange={(value: any) =>
              setState({
                videoFileLink: value,
                videoFileLinkError: false,
              })
            }
            required
            errorMessage={videoFileLinkError}
            // type="Text"
          />
          <TextField
            label="لینک فایل تصویر ویدیو"
            className="2xl:col-span-6 xl:col-span-6 lg:col-span-12 md:col-span-12 sm:col-span-12"
            value={imageFileLink}
            onChange={(value: any) =>
              setState({
                imageFileLink: value,
                imageFileLinkError: false,
              })
            }
            required
            errorMessage={imageFileLinkError}
            // type="Text"
          />
          <TextField
            label="لینک پخش ویدیو"
            className="2xl:col-span-6 xl:col-span-6 lg:col-span-12 md:col-span-12 sm:col-span-12"
            value={streamingLink}
            onChange={(value: any) =>
              setState({
                streamingLink: value,
                streamingLinkError: false,
              })
            }
            required
            errorMessage={streamingLinkError}
            // type="Text"
          />
          <div className="2xl:col-span-6 xl:col-span-6 lg:col-span-12 md:col-span-12 sm:col-span-12 flex items-start justify-end">
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
              ListData?.dossierDataIntroductorySessionInfoResult?.length > 0
                ? ListData?.dossierDataIntroductorySessionInfoResult
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
export default withAlert(DossierFileIntroductionSessionModal);
