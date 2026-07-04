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
import { Button } from '@tse/components/atoms';
import { HeaderTypes } from '@tse/types';
import './style.css';
import { DatePicker } from '@tse/components/molecules';
import {
  findDossierDates,
  saveDossierDate,
  confirmDossierDate,
  rejectDossierDate,
} from 'apps/cash-market/src/Controller/Listing/Modal';
import { Icon } from '@tse/components/atoms';
import { convertDateToJalali } from '@tse/tools';
import useLoadDastineScript from 'apps/cash-market/src/components/hooks/DastineHook';
export function DigitalSignatureExample(props: any) {
  const {
    isOpen,
    modalTitle,
    inputTitle,
    firstColumnTitle,
    data,
    onChangeState,
    onAlert,
    dossierDate,
    dossierDateError,
  } = props;

  const initialState = {
    dossierId: '',
    submenuId: '',
    dateAmount: '',
    dossierDatesList: '',
    // isOpen: true
  };

  const [state, setState] = useStates<any>(initialState);
  const { dossierId, submenuId, dateAmount, dossierDatesList } = state;

  useEffect(() => {
    // if (dossierId != null && submenuId!= null) {
    // }
    handleGateDossierDates();
  }, []);

  const onAcceptDossierTable = (id: any) => {
    handleConfirmDossierDate(id);
    SelectCertificateFromTokenByUI();
  };

  const onRejectDossierTable = (id: any) => {
    handleRejectDossierDate(id);
  };

  const handleConfirmDossierDate = (id: any) => {
    const data = { dossierDataDateId: id };

    confirmDossierDate({
      data,
      onSuccess: (res: any) => handleGateDossierDates(),
      onFail,
    });
  };

  const handleRejectDossierDate = (id: any) => {
    const data = { dossierDataDateId: id };
    rejectDossierDate({
      data,
      onSuccess: (res: any) => handleGateDossierDates(),
      onFail,
    });
  };

  const licenseTableHeader: HeaderTypes[] = [
    {
      title: 'تاریخ درخواست',
      dataIndex: 'dateAmount',
      key: 'dateAmount',
      className: 'col-span-2',
      render: (_: any, item: any) => convertDateToJalali(item?.dateAmount),
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
              className="w-16 h-7  bg-dossierModalTableConfirmButton text-black ml-2"
              onClick={() => onAcceptDossierTable(item?.dossierDataDateId)}
            >
              تایید
            </Button>
            <Button
              className="w-16 h-7  bg-dossierModalTableRejectButton text-black "
              onClick={() => onRejectDossierTable(item?.dossierDataDateId)}
            >
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
      className: 'col-span-2 !justify-center',
      render: (_: any, item: any) => {
        return item?.dossierStateTypeId == 'NotChecked' ? (
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
    {
      title: 'توضیحات',
      dataIndex: 'description',
      key: 'description',
      className: 'col-span-3',
    },
  ];

  const onFail = (error: any) => {
    // onAlert(error);
  };

  const onChangeDate = (key: any, value: any) => {
    setState({ dateAmount: value });
  };
  const onSuccessSaveDate = () => {
    setState({ dateAmount: '' });
    handleGateDossierDates();
  };

  const onAddDate = () => {
    const data = { dossierId: 9, submenuId: 1, dateAmount };
    saveDossierDate({
      data,
      onSuccess: (res: any) => onSuccessSaveDate(),
      onFail,
    });
  };
  const onSuccessGetDate = (res: any) => {
    console.log('res1', res);
    setState({ dossierDatesList: res });
  };

  const handleGateDossierDates = () => {
    const data = { dossierId: 9, submenuId: 1 };
    findDossierDates({
      data,
      onSuccess: (res: any) => onSuccessGetDate(res),
      onFail,
    });
  };

  const onCloseModal = () => {
    onChangeState(data?.componentName, false);

    // setState({isOpen: false})
  };

  useLoadDastineScript(false);
  const SelectCertificateFromTokenByUI = () => {
    const Dastine = (window as any).Dastine;
    if (!Dastine) {
      alert('هنوز بارگذاری نشده!');
      return;
    }

    if (Dastine.isInstalled) {
      try {
        Dastine.SelectCertificateFromTokenByUI('', '', function (event: any) {
          console.log('event.data.Result ', event.data.Result);
          if (event.data.Result == 0) {
            Dastine.GetSelectedCertificate(function (event: any) {
              console.log('event', event);
            });
          }
        });
      } catch (e) {
        console.log('خطا در اجرا');
        alert(e);
      }
    } else {
      if (Dastine.errorMessage == 'DASTINE_NOT_INSTALLED') {
        alert(Dastine.errorMessage + '\n Get it from:\n');
      } else {
        alert(Dastine.errorMessage);
      }
    }
  };

  return (
    <Modal
      visible={isOpen}
      closable={true}
      style={{ textAlign: 'center', padding: '0px' }}
      // title={'استعلام و نظرات'}
      footer={null}
      centered
      width={'70%'}
      className="custom-modal"
      // closable={{ 'aria-label': 'Custom Close Button' }}
      // bodyStyle={{backgroundColor:'listingBackgroundModal'}}
    >
      <div className="grid grid-cols-12 gap-4  justify-center bg-listingBaseColorModal p-6 rounded-2xl">
        <div className="flex col-span-12  justify-center rounded-2xl py-2">
          <span className=" text-white text-base font-bold">تاریخ درخواست</span>
        </div>
        <div className="2xl:col-span-10  xl:col-span-10 lg:col-span-10 grid grid-cols-12  items-center justify-center bg-white rounded-2xl p-6">
          <div className="flex col-span-12 justify-end px-2">
            <span className="font-bold border-b-2">
              {dossierDatesList?.dossierStateTypeName}
            </span>
            <Icon
              name="icon-cartabl"
              classname=" text-lg cursor-pointer px-2"
            />
          </div>
          <div className=" col-span-5 items-center justify-center rounded-2xl my-10">
            <DatePicker
              //   parentClassName="!w-[50%]"
              label="تاریخ درخواست"
              value={dateAmount}
              onChange={(value: any) => onChangeDate('dossierDate', value)}
              onClearDate={() => onChangeDate('dossierDate', '')}
              // error={dossierDateError}
              required
            />
          </div>

          <div className=" col-span-7 items-center justify-start ">
            <Button
              className="w-32 h-9  bg-listingModalRegisterButton text-white m-4"
              onClick={onAddDate}
            >
              ثبت
            </Button>
          </div>
          <div className="col-span-12 mt-5">
            <Table
              columns={licenseTableHeader}
              className="col-span-12 grid grid-cols-12 "
              data={dossierDatesList?.dossierDateInfoResult}
              // onChangePage={onChangeTablePage}
              totalPages={1}
              pageSize={100}
            />
          </div>
        </div>
        <div className="flex flex-col col-span-2 justify-start items-center">
          <Button className="w-36 h-9  bg-listingModalAcceptButton text-white m-2">
            تایید
          </Button>
          <Button className="bg-listingIrrelevantButton w-36 h-9  text-white m-2">
            فاقد موضوعیت
          </Button>
          <Button
            className="bg-[#b20404] text-white w-36 h-9 m-2"
            onClick={onCloseModal}
          >
            انصراف
          </Button>
        </div>
      </div>
    </Modal>
  );
}
export default withAlert(DigitalSignatureExample);
