import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import { Table } from '@tse/components/organism';
import { Button, TreeSelectSearch } from '@tse/components/atoms';
import { HeaderTypes } from '@tse/types';
import {
  modalFindApi,
  modalSaveApi,
  modalConfirmApi,
  modalRejectApi,
} from 'apps/cash-market/src/Controller/Listing/Modal';
import { Icon } from '@tse/components/atoms';
import { getIndustryList } from 'apps/cash-market/src/Controller/Listing/Stock';
import type { TreeSelectProps } from 'antd';
import { ListingModalComponent } from 'apps/cash-market/src/components/atoms/ListingModalComponent';

export function DossierTreeSelectModal(props: any) {
  const { isOpen, modalData, onChangeState, onAlert, handleGetParentApi } =
    props;

  const initialState = {
    industryId: null,
    industryList: null,
    searchValue: '',
    industryError: false,
    isShowChat: false,
    ListData: [],
    industryAmountName: '',
  };

  const [state, setState] = useStates<any>(initialState);
  const {
    industryId,
    industryList,
    searchValue,
    industryError,
    isShowChat,
    ListData,
    industryAmountName,
  } = state;
  const [searchParams] = useSearchParams();
  const dossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;

  useEffect(() => {
    if (modalData != null && isOpen) {
      handleGetList();
      handleGetIndustryList('');
    }
  }, [modalData]);

  const onAcceptDossierTable = (id: any) => {
    const data = { dossierDataIndustryId: id };
    modalConfirmApi({
      data,
      url: modalData?.confirmApiName,
      onSuccess: (res: any) => handleGetList(),
      onFail,
    });
  };

  const onRejectDossierTable = (id: any) => {
    const data = { dossierDataIndustryId: id };
    modalRejectApi({
      data,
      url: modalData?.rejectApiName,
      onSuccess: (res: any) => handleGetList(),
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
              onClick={() => onAcceptDossierTable(item?.dossierDataIndustryId)}
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
              onClick={() => onRejectDossierTable(item?.dossierDataIndustryId)}
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

  const onSuccessAddRow = () => {
    setState({
      industryId: null,
      industryAmountName: '',
    });
    handleGetList();
  };

  const onAddRow = () => {
    if (industryId) {
      const data = {
        dossierId,
        submenuId: modalData?.submenuId,
        amountId: industryId?.toString(),
        amountName: industryAmountName,
      };
      modalSaveApi({
        url: modalData?.saveApiName,
        data,
        onSuccess: (res: any) => onSuccessAddRow(),
        onFail,
      });
    } else {
      setState({
        industryError: true,
      });
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
      industryId: null,
      industryAmountName: '',
      industryError: false,
    });
  };

  const onSuccessSubmit = () => {
    handleGetParentApi(modalData);
    onCloseModal();
  };

  const onChangeIndustry = (newValue: string, option: any) => {
    setState({
      industryId: newValue,
      industryAmountName: option[0],
      industryError: false,
    });
  };

  const handleGetIndustryList = (value: string) => {
    const data = {
      FilterText: value,
      PageNumber: 1,
      PageSize: 20,
    };
    getIndustryList({
      data,
      onSuccess: (res: any) => onSucessGetIndustry(res),
      onFail,
    });
  };

  const convertTreeData = (data: any) => {
    return data?.map((item: any) => ({
      title: item.title,
      value: item.industryId,
      children: convertTreeData(item.childs),
    }));
  };

  const onSucessGetIndustry = (data: any) => {
    const newData = data?.items?.map((item: any) => ({
      title: item.title,
      value: item.industryId,
      children: item?.childs?.length > 0 ? convertTreeData(item.childs) : [],
    }));
    setState({ industryList: newData });
  };

  const onSearchTreeSelect = (value: string) => {
    setState({ searchValue: value });
    handleGetIndustryList(value);
  };

  const onPopupScroll: TreeSelectProps['onPopupScroll'] = (e) => {
    console.log('onPopupScroll', e);
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
      lastValue={ListData?.dossierIndustryInfoResult?.[0]?.amountName}
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
        <div className="col-span-12 grid items-center justify-center grid-cols-12 my-10">
          <TreeSelectSearch
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-6 md:col-span-12 px-2"
            value={industryId}
            treeNodeFilterProp="title"
            label="صنعت"
            onChange={onChangeIndustry}
            treeData={industryList}
            onPopupScroll={onPopupScroll}
            onSearch={onSearchTreeSelect}
            searchValue={searchValue}
            error={industryError}
          />
          <div className="2xl:col-span-8 xl:col-span-8 lg:col-span-6 md:col-span-12 items-center justify-start">
            <Button
              className="w-32 h-9 bg-listingModalRegisterButton text-white mx-4 md:m-0 md:mt-2"
              onClick={onAddRow}
            >
              ثبت
            </Button>
          </div>
        </div>

        <div className="col-span-12 mt-5">
          <Table
            columns={filteredColumn}
            className="col-span-12 grid grid-cols-12 "
            data={
              ListData?.dossierIndustryInfoResult?.length > 0
                ? ListData?.dossierIndustryInfoResult
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
export default withAlert(DossierTreeSelectModal);
