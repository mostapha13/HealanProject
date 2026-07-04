import { Modal } from 'antd';
import { ChildrenType, HeaderTypes } from '@tse/types';
import { AntdSelectSearch, Button, Icon } from '@tse/components/atoms';
import { useEffect, useSearchParams, useStates } from '@tse/utils';
import { SmartTable } from '@tse/components/organism';
import {
  getDossierState,
  saveDossierState,
} from 'apps/cash-market/src/Controller/Listing/PublicInfo';
import { convertDateToJalali } from '@tse/tools';

export interface ModalProps {
  isOpen?: boolean;
  onCloseModal: () => void;
  onAlert?: any;
}
const initialState = {
  selectValue: '',
  selectError: false,
  dossierStateData: [],
};
export function ListingChangeStatusModal(props: ModalProps) {
  const { isOpen, onCloseModal, onAlert } = props;
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const { selectValue, selectError, dossierStateData } = state;
  const DossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;
  const tableHeader: HeaderTypes[] = [
    {
      title: 'تاریخ',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'نام کاربر',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: 'وضعیت قبلی پرونده',
      dataIndex: 'oldDossierLevelTypeName',
      key: 'oldDossierLevelTypeName',
    },
    {
      title: 'وضعیت فعلی پرونده',
      dataIndex: 'dossierLevelTypeName',
      key: 'dossierLevelTypeName',
    },
  ];
  useEffect(() => {
    if (DossierId != null && isOpen) {
      handleGetDossierState();
    }
  }, [isOpen]);

  const onFail = (error: any) => {
    onAlert(error);
  };
  const handleGetDossierState = () => {
    const data = {
      DossierId,
    };
    getDossierState({
      data,
      onSuccess: (res: any) => setState({ dossierStateData: res }),
      onFail,
    });
  };
  const onSubmit = () => {
    if (selectValue) {
      const data = {
        dossierId: DossierId,
        dossierLevelTypeId: selectValue?.dossierLevelTypeId,
      };
      saveDossierState({
        data,
        onSuccess: (res: any) => onSuccessSave(res),
        onFail,
      });
    } else {
      setState({ selectError: true });
    }
  };
  const onSuccessSave = (res: any) => {
    setState({ selectValue: '' });
    handleGetDossierState();
  };
  const onCloseClick = () => {
    setState({ selectValue: '', selectError: false });
    onCloseModal();
  };
  return (
    <Modal
      visible={isOpen}
      closable={false}
      style={{ textAlign: 'right', padding: '0px' }}
      footer={null}
      centered
      width={'95%'}
      className="custom-modal"
    >
      <div className="grid grid-cols-12 gap-4  justify-center items-center bg-listingBaseColorModal p-6 rounded-2xl overflow-y-auto">
        <div className="flex col-span-12 items-center  justify-between rounded-2xl mb-8">
          <Icon
            name="icon-cancel-outline"
            classname="text-[#d4cfcf] text-lg cursor-pointer"
            onClick={onCloseClick}
          />
          <span className=" text-white text-base font-bold"></span>
        </div>
        <div
          className={`grid grid-cols-12 col-span-12  items-center justify-center bg-white rounded-2xl p-6 `}
        >
          <div className="2xl:col-span-4 xl:col-span-4 lg:col-span-6 md:col-span-12 grid grid-cols-12 gap-4 my-10">
            <AntdSelectSearch
              label="تعیین وضعیت پرونده"
              className="col-span-12"
              data={dossierStateData?.dossierLevelTypes}
              onChange={(value: any) => {
                console.log('valueee', value);
                if (value?.dossierLevelTypeName != undefined) {
                  setState({
                    selectValue: value,
                    selectError: false,
                  });
                } else if (value == '') {
                  setState({
                    selectValue: null,
                    selectError: false,
                  });
                }
              }}
              showKey="dossierLevelTypeName"
              idKey="dossierLevelTypeId"
              value={selectValue}
              error={selectError}
            />
          </div>
          <div className="2xl:col-span-8 xl:col-span-8 lg:col-span-6 md:col-span-12 items-center justify-start">
            <Button
              className="w-32 h-9 bg-listingModalRegisterButton text-white m-4 md:m-0 md:mt-2"
              onClick={onSubmit}
            >
              ثبت
            </Button>
          </div>
          <div className="col-span-12 mt-5">
            <SmartTable
              columns={tableHeader}
              data={dossierStateData?.dossierLevelTypeDetail}
              // onChangePage={onChangeTablePage}
              totalPages={1}
              pageSize={100}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
