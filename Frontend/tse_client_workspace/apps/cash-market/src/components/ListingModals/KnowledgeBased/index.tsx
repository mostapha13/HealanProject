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
  modalFindApi,
  modalSaveApi,
  modalConfirmApi,
  modalRejectApi,
} from 'apps/cash-market/src/Controller/Listing/Modal';
import { Icon, TextField } from '@tse/components/atoms';
import { ListingModalComponent } from 'apps/cash-market/src/components/atoms/ListingModalComponent';

export function DossierKnowledgeBasedModal(props: any) {
  const { isOpen, modalData, onChangeState, onAlert, handleGetParentApi } =
    props;

  const initialState = {
    radioValue: true,
    knowledgeBasedTitle: '',
    knowledgeBasedTitleError: false,
    ListData: [],
    isShowChat: false,
  };

  const [state, setState] = useStates<any>(initialState);
  const {
    radioValue,
    knowledgeBasedTitle,
    knowledgeBasedTitleError,
    ListData,
    isShowChat,
  } = state;
  const [searchParams] = useSearchParams();
  const dossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;

  useEffect(() => {
    if (modalData != null && isOpen) {
      handleGetList();
    }
  }, [modalData]);

  const radiobButtonData = [
    {
      id: true,
      name: 'بله',
    },
    {
      id: false,
      name: 'خیر',
    },
  ];

  const onAcceptDossierTable = (id: any) => {
    handleConfirmRecord(id);
  };

  const onRejectDossierTable = (id: any) => {
    handleRejectRecord(id);
  };

  const handleConfirmRecord = (id: any) => {
    const data = { dossierDataKnowledgeBasedId: id };

    modalConfirmApi({
      data,
      url: modalData?.confirmApiName,
      onSuccess: (res: any) => handleGetList(),
      onFail,
    });
  };

  const handleRejectRecord = (id: any) => {
    const data = { dossierDataKnowledgeBasedId: id };
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
      dataIndex: 'knowledgeBasedTitle',
      key: 'knowledgeBasedTitle',
      className: `${
        ListData?.accessAction ? 'col-span-3' : 'col-span-6'
      }`,
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
              onClick={() =>
                onAcceptDossierTable(item?.dossierDataKnowledgeBasedId)
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
                onRejectDossierTable(item?.dossierDataKnowledgeBasedId)
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
      className: `${
        ListData?.accessAction ? 'col-span-4' : 'col-span-5'
      }`,
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
    setState({ selectedValue: '' });
    handleGetList();
  };

  const onAddRow = () => {
    if (knowledgeBasedTitle) {
      const data = {
        dossierId,
        submenuId: modalData?.submenuId,
        isKnowledgeBased: radioValue,
        knowledgeBasedTitle,
      };
      modalSaveApi({
        url: modalData?.saveApiName,
        data,
        onSuccess: (res: any) => onSuccessAddRow(),
        onFail,
      });
    } else {
      setState({ knowledgeBasedTitleError: true });
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
      radioValue: true,
      knowledgeBasedTitle: '',
      knowledgeBasedTitleError: false,
    });
  };

  const onSuccessSubmit = () => {
    handleGetParentApi(modalData);
    onCloseModal();
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
      lastValue={ListData?.dossierKnowledgeBasedInfoResult?.[0]?.knowledgeBasedTitle?.toString()}
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
        <div className="2xl:col-span-4 xl:col-span-4 lg:col-span-6 md:col-span-12 flex flex-col gap-4">
          <Radio.Group
            onChange={handleRadioButtonChange}
            value={radioValue}
            style={{ marginBottom: 5, display: 'flex' }}
          >
            {radiobButtonData?.map((item: any) => (
              <Radio className="text-extratiny font-bold" value={item.id}>
                {item.name}
              </Radio>
            ))}
          </Radio.Group>
          <TextField
            label={modalData?.submenuTitle}
            className="col-span-3"
            value={knowledgeBasedTitle}
            onChange={(value: any) =>
              setState({
                knowledgeBasedTitle: value,
                knowledgeBasedTitleError: false,
              })
            }
            required
            errorMessage={knowledgeBasedTitleError}
            // type="Text"
            disabled={radioValue == false}
          />
        </div>

        <div className="2xl:col-span-8 xl:col-span-8 lg:col-span-6 md:col-span-12 items-center justify-start ">
          <Button
            className="w-32 h-9 bg-listingModalRegisterButton text-white mt-10 mx-4 md:m-0 md:mt-2"
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
              ListData?.dossierKnowledgeBasedInfoResult?.length > 0
                ? ListData?.dossierKnowledgeBasedInfoResult
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
export default withAlert(DossierKnowledgeBasedModal);
