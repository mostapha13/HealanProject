import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import { Modal, Popconfirm, Radio } from 'antd';
import { Table } from '@tse/components/organism';
import { Button, AntdSelectSearch } from '@tse/components/atoms';
import { HeaderTypes } from '@tse/types';
import {
  findDossierSimpleSelect,
  saveDossierSimpleSelect,
  confirmDossierSimpleSelect,
  rejectDossierSimpleSelect,
  getDossierSimpleSelectListData,
} from 'apps/cash-market/src/Controller/Listing/Modal';
import { Icon } from '@tse/components/atoms';
import { ListingModalComponent } from 'apps/cash-market/src/components/atoms/ListingModalComponent';

export function DossierSimpleSelectModal(props: any) {
  const { isOpen, modalData, onChangeState, onAlert, handleGetParentApi } =
    props;

  const initialState = {
    ListData: '',
    dataList: [],
    filterText: '',
    selectedValue: '',
    selectError: false,
    isShowChat: false,
  };

  const [state, setState] = useStates<any>(initialState);
  const {
    ListData,
    dataList,
    filterText,
    selectedValue,
    selectError,
    isShowChat,
  } = state;
  const [searchParams] = useSearchParams();
  const dossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;

  useEffect(() => {
    if (modalData != null && isOpen) {
      handleGateDossierSimpleSelect();
      handleGetSelectData(filterText);
    }
  }, [modalData]);

  const handleGetSelectData = (filterText: any) => {
    const data = {
      FilterText: filterText,
      PageNumber: 1,
      PageSize: 20,
    };
    getDossierSimpleSelectListData({
      data,
      url: modalData?.listApiName,
      onSuccess: (res: any) => setState({ dataList: res }),
      onFail,
    });
  };

  const onAcceptDossierTable = (id: any) => {
    handleConfirmDossierSimpleSelect(id);
  };

  const onRejectDossierTable = (id: any) => {
    handleRejectDossierSimpleSelect(id);
  };

  const handleConfirmDossierSimpleSelect = (id: any) => {
    const data = { dossierDataSelectId: id };

    confirmDossierSimpleSelect({
      data,
      url: modalData?.confirmApiName,
      onSuccess: (res: any) => handleGateDossierSimpleSelect(),
      onFail,
    });
  };

  const handleRejectDossierSimpleSelect = (id: any) => {
    const data = { dossierDataSelectId: id };
    rejectDossierSimpleSelect({
      data,
      url: modalData?.rejectApiName,
      onSuccess: (res: any) => handleGateDossierSimpleSelect(),
      onFail,
    });
  };

  const licenseTableHeader: HeaderTypes[] = [
    {
      title: modalData?.submenuTitle,
      dataIndex: 'amountName',
      key: 'amountName',
      className: `${ListData?.accessAction ? 'col-span-3' : 'col-span-6'}`,
    },
    {
      title: 'اعمال وضعیت',
      dataIndex: 'action',
      key: 'action',
      className: 'col-span-4 !justify-center',
      render: (_: any, item: any) => {
        return (
          <div className="flex flex-row items-center flitems-center justify-center">
            <Button
              className="w-16 h-7 bg-dossierModalTableConfirmButton text-white ml-2"
              onClick={() => onAcceptDossierTable(item?.dossierDataSelectId)}
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
              onClick={() => onRejectDossierTable(item?.dossierDataSelectId)}
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
      className: `${ListData?.accessAction ? 'col-span-4' : 'col-span-5'}`,
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
    // {
    //   title: 'توضیحات',
    //   dataIndex: 'description',
    //   key: 'description',
    //   className: 'col-span-3',
    // },
  ];

  const filteredColumn = ListData?.accessAction
    ? licenseTableHeader
    : licenseTableHeader?.filter((column: any) => column?.key != 'action');

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSuccessSaveSimpleSelect = () => {
    setState({ selectedValue: '' });
    handleGateDossierSimpleSelect();
  };

  const onAddSimpleSelect = () => {
    if (selectedValue) {
      const data = {
        dossierId,
        submenuId: modalData?.submenuId,
        amountId: selectedValue?.id?.toString(),
        amountName: selectedValue?.title,
      };
      saveDossierSimpleSelect({
        url: modalData?.saveApiName,
        data,
        onSuccess: (res: any) => onSuccessSaveSimpleSelect(),
        onFail,
      });
    } else {
      setState({ selectError: true });
    }
  };

  const onSuccessGetSimpleSelect = (res: any) => {
    setState({ ListData: res });
  };

  const handleGateDossierSimpleSelect = () => {
    const dataQuery = { dossierId, submenuId: modalData?.submenuId };
    findDossierSimpleSelect({
      url: modalData?.findApiName,
      data: dataQuery,
      onSuccess: (res: any) => onSuccessGetSimpleSelect(res),
      onFail,
    });
  };

  const onCloseModal = () => {
    onChangeState(modalData?.componentName, false);
    setState({
      selectedValue: '',
      selectError: false,
    });
  };

  const onSuccessSubmit = () => {
    handleGetParentApi(modalData);
    onCloseModal();
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
      lastValue={ListData?.dossierSelectInfoResult?.[0]?.amountName}
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
        <div className="2xl:col-span-4 xl:col-span-4 lg:col-span-6 md:col-span-12 grid grid-cols-12 gap-4 my-10">
          <AntdSelectSearch
            label={modalData?.submenuTitle}
            className="col-span-12"
            data={dataList?.items}
            onChange={(value: any) => {
              if (value?.title != undefined) {
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
            onSearch={(value: any) => handleGetSelectData(value)}
            showKey="title"
            idKey="id"
            value={selectedValue}
            error={selectError}
          />
        </div>

        <div className="2xl:col-span-8 xl:col-span-8 lg:col-span-6 md:col-span-12 items-center justify-start">
          <Button
            className="w-32 h-9 bg-listingModalRegisterButton text-white m-4 md:m-0 md:mt-2"
            onClick={onAddSimpleSelect}
          >
            ثبت
          </Button>
        </div>
        <div className="col-span-12 mt-5">
          {}
          <Table
            columns={filteredColumn}
            className="col-span-12 grid grid-cols-12 "
            data={
              ListData?.dossierSelectInfoResult?.length > 0
                ? ListData?.dossierSelectInfoResult
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
export default withAlert(DossierSimpleSelectModal);
