import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import { Modal, Popconfirm, Radio } from 'antd';
import { SymbolModal, Table } from '@tse/components/organism';
import {
  Button,
  Collapse,
  Icon,
  TextField,
  Upload,
} from '@tse/components/atoms';
import { Modal as ConfirmModal } from '@tse/components/atoms';
import { DatePicker } from '@tse/components/molecules';
import {
  closeFormStock,
  geBrokerList,
  getFundList,
  getInstrumentList,
  getPersonType,
  uploadFile,
} from 'apps/cash-market/src/Controller';
import { HeaderTypes } from '@tse/types';
import {
  convertDateToJalali,
  deSeparator,
  generateRandomNumber,
  separator,
} from '@tse/tools';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import {
  getWholeSaleBuy,
  GetWholesaleBuyerAttachType,
  saveWholeSaleBuyer,
} from 'apps/cash-market/src/Controller/StockMarket/WholeSale';
import ImageUpload from 'apps/cash-market/src/components/ImageUpload';
import React, { useMemo } from 'react';
import { SubmitManagerDataModal } from './ManagerModal';
import Item from 'antd/lib/list/Item';

const initialState = {
  id: '',
  responsibleName: '',
  responsiblePost: '',
  responsibleMobile: '',
  personalityType: [],
  personTypeId: '',
  personTypeIdError: false,
  personTypeName: '',
  fname: '',
  fnameError: '',
  disableFname: false,
  lname: '',
  lnameError: '',
  buyerCode: '',
  buyerCodeError: '',
  buyCount: '',
  buyCountError: '',
  buyPercent: '',
  buyPercentError: '',
  wholesaleBuyer: [],
  tableEditItemId: null,
  parentTableId: '',
  boardMemberModalData: [],
  isBoardMemberDataEntered: true,
  isTrackingModalVisible: false,
  trackingNumber: '',
  typeValueState: '',
  instrumentIdState: '',
  wholesaleIdState: '',
  wholesaleTypeIdState: '',

  fileDescription: '',
  fileDescriptionError: '',
  uploadFileError: false,
  uploadFileName: '',
  uploadFileLink: '',
  uploadFileId: '',
  uploadFileType: '',
  uploadFileValidate: false,
  requireFileUploadComplete: false,
  uploadFileValidateOthers: false,
  requireFileUploadCompleteOthers: false,
  selectedDocumentTypeIsMultiple: false,
  selectedDocumentType: '',
  selectedDocumentTypeName: '',
  allAttachTypeData: [],
  requireAttachDataList: [],
  requireAttachDataListOthers: [],
  publicAttachExpanded: true,
  fileSelectOther: [],
  selectedFileOther: '',
  selectedFileOtherError: '',
  selectedFileOtherValue: '',
  isSubmitManagerVisible: false,
  sellerAttachExpanded: true,
  wholeSaleCondition: false,
  wholesaleBuyerState: [],
  managerFirstName: '',
  tradeVolume: '',
  publicMessages: null,
  isModalCloseFormVisible: false,
  sumOfCashSharePercent: 0,
};

function RequestBuyWholeSale({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId =
    searchParams.get('id') != null ? searchParams.get('id') : null;
  const wholesaleId =
    searchParams.get('wholesaleId') != null
      ? searchParams.get('wholesaleId')
      : null;
  const orderIdAds =
    searchParams.get('orderId') != null ? searchParams.get('orderId') : null;
  const instrumentId =
    searchParams.get('instrumentId') != null
      ? searchParams.get('instrumentId')
      : null;
  const wholesaleTypeId: string | null =
    searchParams.get('wholesaleTypeId') != null
      ? searchParams.get('wholesaleTypeId')
      : null;
  const typeValue =
    searchParams.get('type') != null ? searchParams.get('type') : null;
  const tradeVolumeProps: any =
    searchParams.get('tradeVolume') != null
      ? searchParams.get('tradeVolume')
      : null;
  const [state, setState] = useStates<any>(initialState);
  const [uploadFileListItem, setUploadFileListItem] = useState<any>([]);
  const [uploadFileListItemOthers, setUploadFileListItemOthers] = useState<any>(
    []
  );
  const {
    id,
    responsibleName,
    responsiblePost,
    responsibleMobile,
    personalityType,
    personTypeId,
    personTypeName,
    fname,
    disableFname,
    lname,
    buyerCode,
    buyCount,
    buyPercent,
    wholesaleBuyer,
    tableEditItemId,
    parentTableId,
    boardMemberModalData,
    isBoardMemberDataEntered,
    isTrackingModalVisible,
    trackingNumber,
    typeValueState,
    instrumentIdState,
    wholesaleIdState,
    wholesaleTypeIdState,

    fileDescription,
    uploadFileError,
    uploadFileName,
    uploadFileLink,
    uploadFileId,
    uploadFileType,
    uploadFileValidate,
    requireFileUploadComplete,
    uploadFileValidateOthers,
    requireFileUploadCompleteOthers,
    selectedDocumentTypeIsMultiple,
    selectedDocumentType,
    selectedDocumentTypeName,
    allAttachTypeData,
    requireAttachDataList,
    requireAttachDataListOthers,
    publicAttachExpanded,
    fileSelectOther,
    selectedFileOther,
    selectedFileOtherError,
    selectedFileOtherValue,
    isSubmitManagerVisible,
    sellerAttachExpanded,
    wholeSaleCondition,
    wholesaleBuyerState,
    managerFirstName,
    tradeVolume,
    publicMessages,
    isModalCloseFormVisible,
    sumOfCashSharePercent,
  } = state;
  const messageHeader = [
    {
      title: 'متن پیام',
      dataIndex: 'comment',
      key: 'comment',
      className: 'col-span-7',
    },
    {
      title: 'تاریخ ارسال',
      dataIndex: 'commentDate',
      key: 'commentDate',
      className: 'col-span-2',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'فرستنده',
      dataIndex: 'marketUserName',
      key: 'marketUserName',
      className: 'col-span-2',
    },
  ];
  const sellerColumns: HeaderTypes[] = [
    {
      title: 'شناسه',
      dataIndex: 'tableId',
      className: 'col-span-1 !justify-start',
      key: 'tableId',
    },
    {
      title: 'حقیقی/حقوقی',
      dataIndex: 'personTypeName',
      className: 'col-span-1 !justify-center',
      key: 'personTypeName',
    },
    {
      title: 'نام خریدار',
      dataIndex: 'fname',
      className: 'col-span-2 !justify-center',
      key: 'fname',
    },
    {
      title: 'نام خانوادگی/نام شرکت',
      dataIndex: 'lname',
      className: 'col-span-2 !justify-center',
      key: 'lname',
    },
    {
      title: 'کد ملی/شناسه شرکت',
      dataIndex: 'buyerCode',
      className: 'col-span-1 !justify-center',
      key: 'buyerCode',
    },
    {
      title: 'تعداد سهام یا حق تقدم سهام مورد تقاضا',
      dataIndex: 'buyCount',
      className: 'col-span-1 !justify-center',
      key: 'buyCount',
      render: (item: any, record: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'درصد خرید از کل سهام عرضه شده',
      dataIndex: 'buyPercent',
      className: 'col-span-1 !justify-center',
      key: 'buyPercent',
    },
    {
      title: 'اطلاعات مدیران',
      dataIndex: 'action',
      key: 'action',
      className: 'col-span-1 !justify-center',
      render: (item: any, record: any) => (
        <div className="flex flex-row items-center justify-center">
          {record?.personTypeId === 'cafd25d9-4948-4b97-b3ec-9761e4496e01' ||
          record?.personTypeId === '5882faca-e9d3-4329-b19c-c92eec610c62' ? (
            <Icon
              name="icon-managers-info"
              classname={`${
                record?.wholesaleBuyerInfoBoards?.length > 0
                  ? 'text-green'
                  : 'text-red'
              } text-lg cursor-pointer`}
              onClick={() =>
                setState({
                  isSubmitManagerVisible: true,
                  parentTableId: record?.tableId,
                  boardMemberModalData: record?.wholesaleBuyerInfoBoards,
                })
              }
            />
          ) : null}
        </div>
      ),
    },
    {
      title: 'عملیات',
      dataIndex: 'action',
      key: 'action',
      className: 'col-span-1 !justify-start',
      render: (_: any, item: any) => (
        <div className="flex flex-row items-center justify-center">
          <Icon
            name="icon-edit"
            classname="text-green text-lg cursor-pointer"
            onClick={() => onEditSellerTable(item)}
          />
          <Popconfirm
            title="آیا اطمینان دارید؟"
            okText="بله"
            cancelText="خیر"
            onConfirm={() => onRemoveSellerTable(item)}
          >
            <Icon
              name="icon-delete"
              classname="text-red text-lg cursor-pointer"
            />
          </Popconfirm>
        </div>
      ),
    },
  ];
  useEffect(() => {
    handleGetPersonType();
    if (orderId != null) {
      handleGetWholeSaleBuy(orderId);
    } else if (orderId == null) {
      setState({ typeValueState: typeValue });
      handleGetWholeSaleBuyerAttachType(wholesaleTypeId);
      setState({ tradeVolume: tradeVolumeProps });
    }
  }, []);
  useEffect(() => {
    const newArray = wholesaleBuyer?.map((item: any) => {
      return {
        tableId: item.tableId,
        id: item.tableId,
        name: item?.lname + ' ' + item.tableId,
      };
    });
    const sumOfCashSharePercent = wholesaleBuyer?.reduce(
      (acc: any, curr: any) => acc + parseFloat(curr.buyPercent),
      0
    );
    setState({
      fileSelectOther: newArray,
      sumOfCashSharePercent: sumOfCashSharePercent,
    });
  }, [wholesaleBuyer]);

  useEffect(() => {
    checkRequiredData();
  }, [uploadFileListItem, requireAttachDataList]);
  useEffect(() => {
    checkRequiredDataOthers();
  }, [wholesaleBuyer, uploadFileListItemOthers]);
  useEffect(() => {
    ////////////////////////حقیقی
    if (personTypeId === '25a0a62a-6a39-44b3-a8f6-cde56eb50f0a') {
      setState({ disableFname: false });
      ////////////////////////حقوقی
    } else if (personTypeId === 'cafd25d9-4948-4b97-b3ec-9761e4496e01') {
      setState({ disableFname: true });
      /////////////////صندوق
    } else if (personTypeId === '5882faca-e9d3-4329-b19c-c92eec610c62') {
      setState({ disableFname: true });
      /////////////////خارجی
    } else if (personTypeId === '9fb49b1b-9247-47bd-b873-5003da94d906') {
      setState({ disableFname: false });
    }
  }, [personTypeId]);

  useEffect(() => {
    let uploadFileListItemOthersData: any = [];
    let wholesaleBuyersData: any = [];

    wholesaleBuyerState?.forEach((data: any) => {
      data.wholesaleBuyerFiles?.forEach((file: any) => {
        uploadFileListItemOthersData.push(file);
      });
      wholesaleBuyersData.push({
        wholesaleBuyId: data?.wholesaleBuyId,
        personTypeId: data?.personTypeId,
        personTypeName: data?.personTypeName,
        fname: data?.fname,
        lname: data?.lname,
        buyerCode: data?.buyerCode,
        buyCount: data?.buyCount,
        buyPercent: data?.buyPercent,
        wholesaleBuyerInfoBoards: data?.wholesaleBuyerInfoBoards,
        tableId: data?.tableId,
      });
    });
    setUploadFileListItemOthers(uploadFileListItemOthersData);
    setState({
      wholesaleBuyer: wholesaleBuyersData,
    });
  }, [wholesaleBuyerState]);
  useEffect(() => {
    checkBoardMemberRequireData();
  }, [wholesaleBuyer]);
  const setErrorMessage = (key: string) => {
    const errorMessage = '.';
    setState({ [`${key}Error`]: errorMessage });
  };
  const onFail = (error: any) => {
    onAlert(error);
  };
  const handleGetWholeSaleBuy = (orderId: any) => {
    getWholeSaleBuy({
      orderId: orderId,
      onSuccess: (item) => {
        if (item?.publicFiles == null) {
          setUploadFileListItem([]);
        } else {
          setUploadFileListItem(item?.publicFiles);
        }
        setState({
          id: item?.id,
          typeValueState: item?.wholesaleTypeName,
          wholesaleBuyerState: item?.wholesaleBuyerInfos,
          responsibleName: item?.responsibleName,
          responsiblePost: item?.responsiblePost,
          responsibleMobile: item?.responsibleMobile,
          instrumentIdState: item?.instrumentId,
          wholesaleIdState: item?.wholesaleId,
          wholesaleTypeIdState: item?.wholesaleTypeId,
          tradeVolume: item?.tradeVolume,
          publicMessages: item?.message.length > 0 ? item?.message : null,
        });
        handleGetWholeSaleBuyerAttachType(item?.wholesaleTypeId);
      },
      onFail,
    });
  };
  const handleGetWholeSaleBuyerAttachType = (
    wholesaleTypeId: string | null
  ) => {
    GetWholesaleBuyerAttachType({
      data: {
        WholesaleTypeId: wholesaleTypeId,
      },
      onSuccess: (res) => {
        setState({
          allAttachTypeData: res,
          requireAttachDataList: res.filter(
            (item: any) => item.isRequired && !item.isMultiple
          ),
          requireAttachDataListOthers: res.filter(
            (item: any) => item.isRequired && item.isMultiple
          ),
        });
      },
      onFail,
    });
  };

  function handleGetPersonType() {
    getPersonType({
      onSuccess: (res) => {
        setState({
          personalityType: res,
        });
      },
      onFail,
    });
  }

  const onEditSellerTable = (item: any) => {
    setState({
      personTypeId: item?.personTypeId,
      personTypeName: item?.personTypeName,
      fname: item?.fname,
      lname: item?.lname,
      buyerCode: item?.buyerCode,
      buyCount: item?.buyCount,
      buyPercent: item?.buyPercent,
      tableEditItemId: item?.tableId,
    });
  };
  const onRemoveSellerTable = (record: any) => {
    const newList = wholesaleBuyer.filter(
      (item: any) => item.tableId !== record.tableId
    );
    setState({
      wholesaleBuyer: newList,
    });
  };
  const onSellerInformationClick = () => {
    if (personTypeId && lname && buyerCode && buyCount && buyPercent) {
      const index = wholesaleBuyer.findIndex((object: any) => {
        return object.tableId === tableEditItemId;
      });
      if (index !== -1) {
        setState({
          wholesaleBuyer: [
            ...wholesaleBuyer.slice(0, index),
            {
              wholesaleBuyId:
                orderId != null ? id : '00000000-0000-0000-0000-000000000000',
              personTypeId: personTypeId,
              personTypeName: personTypeName,
              fname: fname,
              lname: lname,
              buyerCode: buyerCode,
              buyCount: buyCount,
              buyPercent: buyPercent,
              wholesaleBuyStatusId: 1,
              tableId: tableEditItemId,
            },
            ...wholesaleBuyer.slice(index + 1),
          ],
          personTypeId: '',
          fname: '',
          lname: '',
          buyerCode: '',
          buyCount: '',
          buyPercent: '',
          tableEditItemId: null,
        });
      } else {
        setState({
          wholesaleBuyer: [
            ...wholesaleBuyer,
            {
              wholesaleBuyId:
                orderId != null ? id : '00000000-0000-0000-0000-000000000000',
              personTypeId: personTypeId,
              personTypeName: personTypeName,
              fname: fname,
              lname: lname,
              buyerCode: buyerCode,
              buyCount: buyCount,
              buyPercent: buyPercent,
              wholesaleBuyStatusId: 1,
              tableId: generateRandomNumber(),
            },
          ],
          personTypeId: '',
          fname: '',
          lname: '',
          buyerCode: '',
          buyCount: '',
          buyPercent: '',
        });
      }
    } else {
      !personTypeId && setErrorMessage('personTypeId');
      !lname && setErrorMessage('lname');
      !buyerCode && setErrorMessage('buyerCode');
      !buyCount && setErrorMessage('buyCount');
      !buyPercent && setErrorMessage('buyPercent');
    }
  };
  const checkRequiredData = () => {
    const notAvailable: any = [];
    requireAttachDataList?.map((item: any) => {
      uploadFileListItem?.some(
        (data: any) => data?.wholesaleBuyerAttachTypeId === item?.id
      )
        ? null
        : notAvailable.push(item);
    });
    if (notAvailable?.length > 0) {
      setState({ uploadFileValidate: true, requireFileUploadComplete: false });
    } else {
      setState({ uploadFileValidate: false, requireFileUploadComplete: true });
    }
  };
  const checkRequiredDataOthers = () => {
    const notAvailable: any = [];
    wholesaleBuyer?.map((parentItem: any, index: any) => {
      requireAttachDataListOthers?.map((item: any) => {
        uploadFileListItemOthers?.some(
          (data: any) =>
            data?.wholesaleBuyerAttachTypeId === item?.id &&
            data?.tableId === parentItem?.tableId
        )
          ? null
          : notAvailable.push(item);
      });
    });
    if (notAvailable?.length > 0) {
      setState({
        uploadFileValidateOthers: true,
        requireFileUploadCompleteOthers: false,
      });
    } else {
      setState({
        uploadFileValidateOthers: false,
        requireFileUploadCompleteOthers: true,
      });
    }
  };
  const checkBoardMemberRequireData = () => {
    const checkFunction = (data: any) => {
      for (let item of data) {
        if (
          item.personTypeId === 'cafd25d9-4948-4b97-b3ec-9761e4496e01' ||
          item.personTypeId === '5882faca-e9d3-4329-b19c-c92eec610c62'
        ) {
          if (
            !item.wholesaleBuyerInfoBoards ||
            item.wholesaleBuyerInfoBoards.length === 0
          ) {
            return false;
          }
        }
      }
      return true;
    };
    const result = checkFunction(wholesaleBuyer);
    if (wholesaleBuyer.length > 0) {
      setState({ isBoardMemberDataEntered: result });
    } else {
      setState({ isBoardMemberDataEntered: true });
    }
  };

  const onRemoveFile = () => {
    setState({
      uploadFileName: 'حذف گردید',
      uploadFileLink: '',
      uploadFileError: true,
    });
  };

  const onChangeFile = (e: any) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) => onSuccessUpload(res),
      onFail,
    });
  };
  const onSuccessUpload = (res: any) => {
    setState({
      uploadFileName: res?.fileName,
      uploadFileLink: res?.link,
      uploadFileId: res?.fileId,
      uploadFileType: res?.fileType,
      uploadFileError: false,
    });
  };
  const onUploadFileSubmit = () => {
    if (selectedDocumentType && uploadFileLink) {
      const uploadItem = {
        // id: null,
        wholesaleBuyId:
          orderId != null ? id : '00000000-0000-0000-0000-000000000000',
        wholesaleBuyerAttachTypeId: selectedDocumentType,
        wholesaleBuyerAttachTypeName: '',
        attachDescription: fileDescription,
        fileId: uploadFileId,
        uploadFileLink: uploadFileLink,
        uploadFileType: uploadFileType,
        attachTypeName: selectedDocumentTypeName,
        tableId: null,
        fileName: uploadFileName,
      };
      const uploadItemOthers = {
        // id: null,
        wholesaleBuyId:
          orderId != null ? id : '00000000-0000-0000-0000-000000000000',
        wholesaleBuyerAttachTypeId: selectedDocumentType,
        wholesaleBuyerAttachTypeName: '',
        attachDescription: fileDescription,
        fileId: uploadFileId,
        uploadFileLink: uploadFileLink,
        uploadFileType: uploadFileType,
        attachTypeName: selectedDocumentTypeName,
        tableId: parseInt(selectedFileOther),
        fileName: uploadFileName,
      };
      if (!selectedDocumentTypeIsMultiple) {
        setUploadFileListItem((item: any) => [...item, uploadItem]);
        setState({
          selectedDocumentTypeName: '',
          fileDescription: '',
          uploadFileName: '',
          uploadFileLink: '',
          selectedDocumentType: '',
          publicAttachExpanded: true,
        });
      } else {
        if (
          selectedFileOtherValue == '' ||
          selectedFileOtherValue == undefined
        ) {
          !selectedFileOther && setErrorMessage('selectedFileOther');
          onAlert({
            message: `ابتدا اطلاعات متقاضیان خرید را وارد نمایید و سپس فایل های مربوط به آن را بارگذاری نمایید.`,
            type: 'error',
          });
        } else {
          setUploadFileListItemOthers((item: any) => [
            ...item,
            uploadItemOthers,
          ]);
          setState({
            selectedDocumentTypeName: '',
            fileDescription: '',
            uploadFileName: '',
            uploadFileLink: '',
            selectedDocumentType: '',
            selectedFileSellOrBuy: '',
            selectedFileSellOrBuyValue: '',
            selectedFileOther: '',
            selectedFileOtherValue: '',
            sellerAttachExpanded: true,
          });
        }
      }
    } else {
      !selectedDocumentType && setErrorMessage('selectedDocumentType');
      // !fileDescription && setErrorMessage('fileDescription');
      !uploadFileLink && setErrorMessage('uploadFile');
    }
  };
  const onDeleteFileList = (id: any) => {
    setUploadFileListItem((item: any) =>
      item.filter((data: any) => data?.fileId != id)
    );
  };
  const onDeleteFileListOthers = (id: any) => {
    setUploadFileListItemOthers((item: any) =>
      item.filter((data: any) => data?.fileId != id)
    );
  };
  function onSubmitClick(): void {
    checkRequiredData();
    if (
      responsibleName &&
      responsiblePost &&
      responsibleMobile &&
      requireFileUploadComplete === true &&
      sumOfCashSharePercent === 100
    ) {
      if (!isBoardMemberDataEntered) {
        onAlert({
          message: `اطلاعات مربوط به مدیران را ثبت نمایید.`,
          type: 'error',
        });
      } else if (requireFileUploadCompleteOthers == false) {
        onAlert({
          message: `مدارک مربوط به خریداران را به طور کامل وارد نمایید.`,
          type: 'error',
        });
      } else {
        const wholesaleBuyersData = wholesaleBuyer?.map((item: any) => {
          const matchingSecondItem = uploadFileListItemOthers?.filter(
            (secondItem: any) => secondItem?.tableId === item?.tableId
          );
          if (matchingSecondItem?.length > 0) {
            return {
              ...item,
              wholesaleBuyerFiles: matchingSecondItem,
            };
          }
          return item;
        });
        const data = {
          id: orderId != null ? id : '00000000-0000-0000-0000-000000000000',
          orderId:
            orderId != null ? orderId : '00000000-0000-0000-0000-000000000000',
          instrumentId: orderId != null ? instrumentIdState : instrumentId,
          wholesaleId: orderId != null ? wholesaleIdState : wholesaleId,
          wholesaleTypeId:
            orderId != null ? wholesaleTypeIdState : wholesaleTypeId,
          responsibleName: responsibleName,
          responsiblePost: responsiblePost,
          responsibleMobile: responsibleMobile,
          wholesaleBuyStatusId: 1,
          wholesaleBuyerInfos: wholesaleBuyersData,
          publicFiles: uploadFileListItem,
        };
        saveWholeSaleBuyer({ data, onSuccess: onSuccessSave, onFail });
      }
    } else {
      !responsibleName && setErrorMessage('responsibleName');
      !responsiblePost && setErrorMessage('responsiblePost');
      !responsibleMobile && setErrorMessage('responsibleMobile');
    }
  }
  const onSuccessSave = (res: any) => {
    setState({
      isTrackingModalVisible: true,
      trackingNumber: res?.trackingNumber,
    });
    setTimeout(() => {
      setState({ isTrackingModalVisible: false });
      navigate('/cartable');
    }, 4000);
  };

  const onChangeState = (key: string, value: string) => {
    setState({
      [key]: value,
    });
  };
  const submitBoardMembersData = (tableId: string, data: any) => {
    const boardMembersData = wholesaleBuyer?.map((item: any) => {
      if (item?.tableId == tableId) {
        return {
          ...item,
          wholesaleBuyerInfoBoards: data,
        };
      } else {
        return {
          ...item,
        };
      }
    });
    setState({ wholesaleBuyer: boardMembersData });
  };
  const TrackingModal = () => {
    return (
      <>
        <Modal
          visible={isTrackingModalVisible}
          closable={false}
          style={{ textAlign: 'center', padding: '0px' }}
          title={'درخواست خرید عمده'}
          footer={null}
          centered
          width={400}
        >
          <div className="flex justify-center flex-col items-center">
            <span className=" font-bold  my-4">
              اطلاعات شما با موفقیت ارسال شد.
            </span>
            <span className="text-blue text-base">
              کد پیگیری : {trackingNumber}
            </span>
          </div>
        </Modal>
      </>
    );
  };
  const onCloseForm = () => {
    const data = {
      orderId: orderId,
    };
    closeFormStock({
      data: data,
      onSuccess: (res) => {
        onAlert({
          type: 'success',
          message: 'درخواست شما ابطال گردید',
        });
        navigate('/cartable');
      },
      onFail,
    });
  };

  return (
    <div>
      <SubmitManagerDataModal
        isOpen={isSubmitManagerVisible}
        onChangeState={onChangeState}
        parentTableId={parentTableId}
        wholesaleBuyerInfoId={
          orderId ? orderId : '00000000-0000-0000-0000-000000000000'
        }
        onSubmitBoardMembers={submitBoardMembersData}
        data={boardMemberModalData}
        onAlert={onAlert}
      />
      <TrackingModal />
      <div className="border-2 border-lightGray w-full grid grid-cols-12">
        <div className=" col-span-12 items-start flex border-b-2 border-lightGray">
          <span className=" p-2 font-bold">درخواست خرید عمده</span>
        </div>
        <div className="2xl:col-span-12 xl:col-span-12 lg:col-span-12 md:col-span-12  col-span-12 mx-4 mt-4">
          <span className=" font-bold text-md">نوع فروش : </span>
          <span>{typeValueState}</span>
        </div>
        <div className="2xl:col-span-12 xl:col-span-12 lg:col-span-12 md:col-span-12  col-span-12 mx-4 mt-4">
          <span className=" font-bold text-md">
            تعداد کل سهام قابل واگذاری :
          </span>
          <span> {separator(tradeVolume)}</span>
        </div>
        <div className="grid col-span-12 grid-cols-10 gap-4  justify-between mx-4 mt-4">
          <div className=" col-span-10 items-start flex mt-4 ">
            <span className=" p-2 font-bold text-blue underline">
              متقاضیان خرید :
            </span>
          </div>
          <div className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2">
            <NewSelect
              label="حقیقی/حقوقی"
              className="col-span-2"
              options={[{ name: '', id: '' }, ...personalityType]}
              onChange={(value: any) =>
                setState({
                  personTypeId: value,
                  personTypeIdError: false,
                  personTypeName: personalityType.filter(
                    (item: any) => item?.id == value
                  )?.[0]?.name,
                })
              }
              showKey="name"
              selectedKey="id"
              required
              value={personTypeId}
              errorMessage={state?.personTypeIdError}
            />
          </div>
          {!disableFname && (
            <TextField
              label="نام خریدار"
              className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
              value={fname}
              onChange={(value: any) =>
                setState({
                  fname: value,
                  fnameError: '',
                })
              }
              // required
              // errorMessage={state?.fnameError}
            />
          )}
          <TextField
            label="نام خانوادگی/نام شرکت"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={lname}
            onChange={(value: any) =>
              setState({
                lname: value,
                lnameError: '',
              })
            }
            required
            errorMessage={state?.lnameError}
          />
          <TextField
            label="کد ملی/شناسه شرکت"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={buyerCode}
            onChange={(value: any) =>
              setState({
                buyerCode: value,
                buyerCodeError: '',
              })
            }
            required
            errorMessage={state?.buyerCodeError}
            maxLength={11}
          />
          <TextField
            label="تعداد سهام یا حق تقدم سهام مورد تقاضا"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={buyCount}
            onChange={(value: any) => {
              const share = value / tradeVolume;
              setState({
                buyCount: value,
                buyCountError: '',
                buyPercent: (share * 100).toFixed(2),
                buyPercentError: '',
              });
            }}
            required
            errorMessage={state?.buyCountError}
            type="numeric"
          />
          <TextField
            label="درصد خرید از کل سهام عرضه شده"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={buyPercent}
            onChange={(value: any) => {
              const share = value * tradeVolume;
              setState({
                buyPercent: value,
                buyPercentError: '',
                buyCount: share / 100,
                buyCountError: '',
              });
            }}
            required
            errorMessage={state?.buyPercentError}
            type="number"
            max={100}
          />
          <Button
            onClick={onSellerInformationClick}
            className="bg-green w-24 h-9 text-white 2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
          >
            تایید و اضافه
          </Button>
          <div className="col-span-10">
            {!isBoardMemberDataEntered && (
              <span className="text-red">
                لطفا اطلاعات مدیران را وارد نمایید
              </span>
            )}
            <div className=" col-span-10 flex flex-row justify-end">
              <span>مجموع تعداد : {wholesaleBuyer.length} </span>
              <span className="mx-2 font-extra-bold"> | </span>
              <span> مجموع درصد : {sumOfCashSharePercent}</span>
            </div>
            <div className=" col-span-10 flex flex-row justify-end">
              {sumOfCashSharePercent != 100 && (
                <span className=" text-red">
                  خطا: مجموع درصد باید 100 درصد باشد
                </span>
              )}
            </div>
          </div>
          <div className="col-span-10">
            <Table
              columns={sellerColumns}
              className="col-span-10 grid grid-cols-12 text-center"
              dataSource={wholesaleBuyer}
              pageSize={1000}
            />
          </div>
        </div>
        <div className=" col-span-12 items-start flex mt-4 mx-1 ">
          <span className=" p-2 font-bold text-blue underline">
            اطلاعات رابط :
          </span>
        </div>
        <div className="grid col-span-12 grid-cols-12 gap-4  justify-between mx-4 mt-4">
          <TextField
            label="نام و نام خانوادگی"
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={responsibleName}
            onChange={(value: any) =>
              setState({
                responsibleName: value,
                responsibleNameError: '',
              })
            }
            required
            errorMessage={state?.responsibleNameError}
          />
          <TextField
            label="سمت"
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={responsiblePost}
            onChange={(value: any) =>
              setState({
                responsiblePost: value,
                responsiblePostError: '',
              })
            }
            required
            errorMessage={state?.responsiblePostError}
          />

          <TextField
            label="شماره همراه"
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={deSeparator(responsibleMobile)}
            onChange={(value: any) =>
              setState({
                responsibleMobile: value,
                responsibleMobileError: '',
              })
            }
            required
            errorMessage={state?.responsibleMobileError}
            maxLength={11}
            // type="number"
          />
        </div>
        {publicMessages && (
          <div className="col-span-12 mt-8 ">
            <span className="  font-bold text-blue underline mx-4 ">
              توضیحات :
            </span>
            <Table
              columns={messageHeader}
              className="col-span-12 grid grid-cols-12"
              wrapperClassName="!m-4"
              data={publicMessages}
              isPagination={false}
            />
          </div>
        )}
        <div className="grid col-span-12 grid-cols-12 gap-4  justify-between mx-4 mt-4">
          <div className=" col-span-12 items-start flex flex-col mt-4 ">
            <span className=" font-bold text-blue underline">
              بارگذاری مدارک :
            </span>
            <span className="p-2 text-red ">
              {uploadFileValidate
                ? 'مدارک را به طور کامل بارگذاری نمایید.'
                : ''}
            </span>
            <span className="p-2 text-red ">
              {uploadFileValidateOthers
                ? 'مدارک مربوط به خریداران را به طور کامل بارگذاری نمایید.'
                : ''}
            </span>
          </div>
          <div className="grid grid-cols-12 col-span-12 gap-4  items-center border-2 border-lightGray  p-6 ">
            <div className="2xl:col-span-2 xl:col-span-4 lg:col-span-4 md:col-span-6 col-span-2 mx-2">
              <NewSelect
                label="نوع مدرک"
                className=" col-span-2"
                options={[{ name: '', id: '' }, ...allAttachTypeData]}
                onChange={(value: any) => {
                  setState({
                    selectedDocumentType: value,
                    selectedDocumentTypeError: false,
                    selectedDocumentTypeName: allAttachTypeData.filter(
                      (item: any) => item?.id === value
                    )?.[0]?.name,
                    selectedDocumentTypeIsMultiple: allAttachTypeData.filter(
                      (item: any) => item?.id === value
                    )?.[0]?.isMultiple,
                  });
                }}
                showKey="name"
                selectedKey="id"
                required
                value={selectedDocumentType}
                errorMessage={state?.selectedDocumentTypeError}
              />
            </div>
            {selectedDocumentTypeIsMultiple && (
              <div className="2xl:col-span-2 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-2">
                <NewSelect
                  label="متقاضی خرید"
                  className="col-span-2"
                  options={[{ name: '', id: '' }, ...fileSelectOther]}
                  onChange={(value: any) =>
                    setState({
                      selectedFileOther: value,
                      selectedFileOtherError: false,
                      selectedFileOtherValue: fileSelectOther.filter(
                        (item: any) => item?.id == value
                      )?.[0]?.name,
                    })
                  }
                  showKey="name"
                  selectedKey="id"
                  required
                  value={selectedFileOther}
                  errorMessage={state?.selectedFileSellOrBuyError}
                />
              </div>
            )}

            <TextField
              label="توضیحات"
              className="2xl:col-span-2 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-2"
              value={fileDescription}
              onChange={(value: any) =>
                setState({
                  fileDescription: value,
                  fileDescriptionError: '',
                })
              }
              // required
              // errorMessage={state?.fileDescriptionError}
            />
            <div className=" 2xl:col-span-4 xl:col-span-10 lg:col-span-12 md:col-span-12  col-span-3 mr-4">
              <Upload
                onChange={(file: any) => onChangeFile(file)}
                value={uploadFileName}
                href={uploadFileLink}
                name="uploadFile"
                onDelete={() => onRemoveFile()}
                error={uploadFileError}
              />
            </div>
            <div className=" 2xl:col-span-2 xl:col-span-2 lg:col-span-4 md:col-span-5  col-span-2 flex rounded-full ml-2 justify-end">
              <Button
                className="border-green border text-white bg-green w-[110px]"
                onClick={onUploadFileSubmit}
              >
                بارگذاری مدارک
              </Button>
            </div>
          </div>
        </div>
        <Collapse
          className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] bg-[#EEEBFF] rounded-sm p-1 mb-3 col-span-12 gap-4  justify-between mx-4 mt-4"
          title="مدارک و مستندات عمومی"
          expanded={publicAttachExpanded}
          onChange={(e: any, isOpen: boolean) =>
            setState({ publicAttachExpanded: isOpen })
          }
        >
          <div className="grid col-span-10 grid-cols-12 gap-4  justify-between mx-4 mt-4 mb-4">
            <div className=" col-span-3  bg-lightGray py-2">
              {requireAttachDataList?.map((item: any) => {
                return (
                  <div className="flex flex-row items-center px-4 py-1">
                    <div className="w-4">
                      <div
                        className={`w-4 h-4  rounded-full border-2 border-gray ${
                          uploadFileListItem?.some(
                            (data: any) =>
                              data?.wholesaleBuyerAttachTypeId === item?.id
                          )
                            ? 'bg-green'
                            : 'bg-red'
                        } `}
                      />
                    </div>
                    <span className="mr-4"> {item.name}</span>
                  </div>
                );
              })}
            </div>
            <div className=" col-span-9 grid grid-cols-6 ">
              {uploadFileListItem?.length > 0 &&
                uploadFileListItem?.map((item: any, index: any) => (
                  <ImageUpload
                    className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-3"
                    data={item}
                    onAlert={onAlert}
                    onDeleteFile={onDeleteFileList}
                  />
                ))}
            </div>
          </div>
        </Collapse>
        {wholesaleBuyer.length > 0 && (
          <Collapse
            className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] bg-[#EEEBFF] rounded-sm p-1 mb-3 col-span-12 gap-4  justify-between mx-4 mt-4"
            title="مدارک و مستندات متقاضی خرید"
            expanded={sellerAttachExpanded}
            onChange={(e: any, isOpen: boolean) =>
              setState({ sellerAttachExpanded: isOpen })
            }
          >
            {wholesaleBuyer?.map((parentItem: any, index: any) => (
              <div className="grid col-span-10 grid-cols-12 gap-4  justify-between mx-4 mt-4 mb-4">
                <div className="col-span-12">
                  <span>{`${parentItem?.lname} `}</span>
                </div>
                <div className=" col-span-3  bg-lightGray py-2">
                  {requireAttachDataListOthers?.map((item: any) => {
                    return (
                      <div className="flex flex-row items-center px-4 py-1">
                        <div className="w-4">
                          <div
                            className={`w-4 h-4  rounded-full border-2 border-gray ${
                              uploadFileListItemOthers?.some(
                                (data: any) =>
                                  data?.wholesaleBuyerAttachTypeId ===
                                    item?.id &&
                                  data?.tableId === parentItem?.tableId
                              )
                                ? 'bg-green'
                                : 'bg-red'
                            } `}
                          />
                        </div>
                        <span className="mr-4"> {item.name}</span>
                      </div>
                    );
                  })}
                </div>
                <div className=" col-span-9 grid grid-cols-6 ">
                  {uploadFileListItemOthers?.length > 0 &&
                    uploadFileListItemOthers?.map(
                      (item: any, index: any) =>
                        item?.tableId === parentItem?.tableId && (
                          <ImageUpload
                            className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-3"
                            data={item}
                            onAlert={onAlert}
                            onDeleteFile={onDeleteFileListOthers}
                          />
                        )
                    )}
                </div>
              </div>
            ))}
          </Collapse>
        )}
      </div>
      <div className="flex justify-end my-4">
        <a
          href="/cartable"
          className="border-blue border  text-blue w-[120px] h-[35px]  flex items-center justify-center ml-4 rounded"
          // onClick={onConfirm}
        >
          بازگشت
        </a>
        {orderId && (
          <a
            className="border-red border text-red w-[120px] h-[35px] flex items-center justify-center rounded "
            onClick={() => setState({ isModalCloseFormVisible: true })}
          >
            ابطال
          </a>
        )}
        <a
          className="border-blue border bg-blue w-[120px] h-[35px] text-white flex items-center justify-center mr-4 rounded"
          onClick={onSubmitClick}
        >
          ثبت
        </a>
      </div>
      <ConfirmModal
        handleOk={() => onCloseForm()}
        handleCancel={() => setState({ isModalCloseFormVisible: false })}
        isModalVisible={isModalCloseFormVisible}
        title={`آیا نسبت به ابطال درخواست خود اطمینان دارید؟`}
      />
    </div>
  );
}
export default withAlert(RequestBuyWholeSale);
