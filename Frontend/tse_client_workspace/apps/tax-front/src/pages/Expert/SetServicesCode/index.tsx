import { SimpleForm } from '@tse/components/molecules';
import { HeaderTypes, ListType, onAlertProps } from '@tse/types';
import { useState, useEffect, useRef } from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import { Radio, RadioChangeEvent } from 'antd';
import { Icon, Modal, Upload } from '@tse/components/atoms';
import { FILE_BASE_URL } from 'apps/tax-front/src/constants';
import { Table } from 'apps/tax-front/src/components/Table';
import {
  setExcelServiceCode,
  setServiceCode,
  getAllServiceCode,
  deleteServiceCode,
  searchServiceCode,
  updateServiceCode,
} from './service';
import { Input, Space } from 'antd';
const { Search } = Input;
interface SetServicesCodeType {
  onAlert: onAlertProps;
}
const pageSize = 10;
function SetServicesCode(props: SetServicesCodeType) {
  const { onAlert } = props;
  const [values, setValues] = useState({});
  const [excelFileValues, setExcelFileValues] = useState({});
  const [isLoading, setLoading] = useState(false);
  const [buyersCodeType, setBuyersCodeType] = useState('manual');
  const [isModalDeleteVisible, setIsModalDeleteVisible] = useState(false);
  const [deleteItemID, setDeleteItemID] = useState('');
  const [getAllServiceCodeState, setGetAllServiceCodeState] = useState<any>([]);
  const [pageNumber, setPageNumber] = useState(1);

  const uploadUrl = `${FILE_BASE_URL}Upload`;

  const childRef: any = useRef();
  const onFail = (error: any) => {
    setLoading(false);
    onAlert({ type: 'error', message: error?.data?.message });
  };
  const tableHeader: HeaderTypes[] = [
    {
      title: 'نام خدمت',
      dataIndex: 'serviceName',
      key: 'serviceName',
      className: 'col-span-3',
      sorter: false,
    },
    {
      title: 'شناسه عمومی خدمت',
      dataIndex: 'publicKeyService',
      key: 'publicKeyService',
      className: 'col-span-3',
      sorter: false,
    },
    {
      title: 'شناسه خدمت',
      dataIndex: 'serviceKey',
      key: 'serviceKey',
      className: 'col-span-3',
      sorter: false,
    },
    {
      title: 'نوع خدمت',
      dataIndex: 'serviceType',
      key: 'serviceType',
      className: 'col-span-3',
      sorter: false,
    },
    {
      title: 'عمومی / اختصاصی',
      dataIndex: 'isPublic',
      key: 'isPublic',
      className: 'col-span-3',
      sorter: false,
      render: (item: any) => (
        <span>
          {item === '1' ? 'عمومی' : item === '0' ? 'اختصاصی' : 'هیچکدام'}
        </span>
      ),
    },
    {
      title: 'مشمول / غیر مشمول',
      dataIndex: 'isInclude',
      key: 'isInclude',
      className: 'col-span-3',
      sorter: false,
      render: (item: any) => (
        <span>
          {item === '1' ? 'مشمول' : item === '0' ? 'غیر مشمول' : 'هیچکدام'}
        </span>
      ),
    },
    {
      title: 'درصد مالیات',
      dataIndex: 'taxPersent',
      key: 'taxPersent',
      className: 'col-span-3',
      sorter: false,
    },
    {
      title: 'واحد اندازه گیری',
      dataIndex: 'measurmentUnit',
      key: 'measurmentUnit',
      className: 'col-span-3',
      sorter: false,
    },
    {
      title: 'شرح قیمت',
      dataIndex: 'priceDescription',
      key: 'priceDescription',
      className: 'col-span-3',
      sorter: false,
    },
    {
      title: '',
      className: 'col-span-1',
      render: (_: any, record: any) => {
        return (
          <a
            onClick={() => {
              // setState({ isModalOpen: true, deleteFoodDate: record?.date })
              setIsModalDeleteVisible(true);
              setDeleteItemID(record?.id);
            }}
          >
            <Icon name=" icon-delete" classname=" text-red text-lg" />
          </a>
        );
      },
    },
    {
      dataIndex: 'icon-edit',
      title: '',
      render: (_: any, record: any) => {
        return (
          <a
            onClick={() => {
              handleEdit(record);
            }}
          >
            <Icon name="icon-edit" classname=" text-black text-lg" />
          </a>
        );
      },
      className: 'col-span-1',
    },
  ];
  const formList: ListType[] = [
    {
      name: 'serviceName',
      label: 'نام خدمت',
      itemType: 'input',
      className: 'col-span-3',
      require: 'نام خدمت را وارد نمایید',
      required: true,
    },
    {
      name: 'publicKeyService',
      label: 'شناسه عمومی خدمت',
      itemType: 'input',
      className: 'col-span-3',
      require: 'شناسه عمومی خدمت را وارد نمایید',
      required: true,
    },

    {
      name: 'serviceKey',
      label: 'شناسه خدمت',
      itemType: 'input',
      className: 'col-span-3',
      require: 'شناسه خدمت را وارد نمایید',
      required: true,
    },
    {
      name: 'serviceType',
      label: 'نوع خدمت',
      itemType: 'input',
      className: 'col-span-3',
      require: 'نوع خدمت را وارد نمایید',
      required: true,
    },
    {
      name: 'isPublic',
      label: 'عمومی / اختصاصی',
      itemType: 'select',
      className: 'col-span-3',
      options: [
        { name: 'هیچکدام', value: '' },
        { name: 'عمومی', value: '1' },
        { name: 'اختصاصی', value: '0' },
      ],
    },
    {
      name: 'isInclude',
      label: 'مشمول / غیر مشمول',
      itemType: 'select',
      className: 'col-span-3',
      options: [
        { name: 'هیچکدام', value: '' },
        { name: 'مشمول', value: '1' },
        { name: 'غیر مشمول', value: '0' },
      ],
    },

    {
      name: 'taxPersent',
      label: 'درصد مالیات',
      itemType: 'input',
      className: 'col-span-3',
      type: 'number',
    },
    {
      name: 'measurmentUnit',
      label: 'واحد اندازه گیری',
      itemType: 'input',
      className: 'col-span-3',
      require: 'واحد اندازه گیری را وارد نمایید',
      required: true,
    },
    {
      name: 'priceDescription',
      label: 'شرح قیمت',
      itemType: 'input',
      className: 'col-span-6',
      require: 'شرح قیمت را وارد نمایید',
      required: true,
    },
    {
      name: 'submit',
      value: 'ثبت',
      type: 'submit',
      itemType: 'button',
      buttonClassName: 'bg-buttonBlue',
      className: 'col-span-6 grid justify-end   ',
    },
  ];
  const uploadList: ListType[] = [
    {
      name: 'tr_Files_Id',
      itemType: 'file',
      require: 'ارسال فایل اجباری است',
      inputWrapperClassName: 'group-focus-within:border-purple',
      className: 'col-span-4',
      link: `${FILE_BASE_URL}Download/`,
      uploadUrl,
      // token,
      onFail,
      fileFormat: '.xlsx,.xls',
    },
    {
      name: 'submit',
      value: 'ثبت',
      type: 'submit',
      itemType: 'button',
      buttonClassName: 'bg-buttonBlue',
      className: 'col-span-1   ',
    },
  ];
  useEffect(() => {
    handleGetAllServiceCode();
  }, []);
  useEffect(() => {
    handleGetAllServiceCode();
  }, [pageNumber]);
  const handleGetAllServiceCode = () => {
    getAllServiceCode({
      pageNumber: pageNumber,
      pageSize: pageSize,
      onSuccess: (res) => {
        setGetAllServiceCodeState(res?.data);
      },
      onFail,
    });
  };
  function handleSubmit(param: any) {
    if (param.id) {
      updateServiceCode({
        data: param,
        onSuccess: (res) => {
          if (res?.data?.isSuccess) {
            onAlert({
              type: 'success',
              message: 'کد خدمت با موفقیت به روزرسانی گردید',
            });
            handleGetAllServiceCode();
          }
        },
        onFail,
      });
    } else {
      setServiceCode({
        data: param,
        onSuccess: (res) => {
          if (res?.isSuccess) {
            onAlert({
              type: 'success',
              message: 'کد خدمت با موفقیت ثبت گردید',
            });
            handleGetAllServiceCode();
          }
        },
        onFail,
      });
    }
  }
  function handleSubmitExcelFile(param: any) {
    setExcelServiceCode({
      excelUrl: param?.tr_Files_Id?.fileId?.fileId,
      onSuccess: (res) => {
        if (res?.isSuccess) {
          onAlert({
            type: 'success',
            message: 'فایل اکسل کد خدمت با موفقیت ثبت گردید',
          });
          handleGetAllServiceCode();
        }
      },
      onFail,
    });
  }
  const onOkModalDeleteClick = () => {
    deleteServiceCode({
      id: parseInt(deleteItemID),
      onSuccess: (res) => {
        if (res?.data?.isSuccess) {
          onAlert({
            type: 'success',
            message: 'کد خدمت انتخابی با موفقیت حذف گردید',
          });
          handleGetAllServiceCode();
          setIsModalDeleteVisible(false);
        }
      },
      onFail,
    });
  };
  function handleSubmitSearch(param: any) {
    searchServiceCode({
      value: param,
      pageNumber: pageNumber,
      pageSize: pageSize,
      onSuccess: (res) => {
        setGetAllServiceCodeState(res?.data);
      },
      onFail,
    });
  }
  const handlePageChange = (PageNumber: any) => {
    setPageNumber(PageNumber);
  };
  const handleSetBuyersCode = (e: RadioChangeEvent) => {
    setBuyersCodeType(e.target.value);
  };
  function handleEdit(values: any) {
    setValues(values);
  }
  return (
    <div className="p-10">
      <div className="px-6">
        <h2 className="col-span-full text-lg font-medium border-b-2 py-4 border-lightGray">
          تعریف کد خدمت
        </h2>
        <div className=" grid grid-cols-12 gap-4 py-10 px-4 mt-6 shadow-[0_0px_5px_rgba(0,0,0,0.2)]">
          <span className=" col-span-12 ">
            جهت تعریف کد خدمات می توانید از طریق بارگذاری اکسل یا دستی اقدام
            نمایید.
          </span>
          <div className=" col-span-12 my-4 flex-row ">
            <Radio.Group
              defaultValue="1"
              onChange={handleSetBuyersCode}
              value={buyersCodeType}
              style={{ marginBottom: 5 }}
            >
              <Radio value="manual">دستی</Radio>
              <Radio value="excel">اکسل</Radio>
            </Radio.Group>
          </div>
          {buyersCodeType === 'manual' && (
            <SimpleForm
              className="col-span-12 grid grid-cols-12 gap-5"
              list={formList}
              onSubmit={handleSubmit}
              values={values}
              isLoading={isLoading}
              reference={childRef}
            />
          )}
          {buyersCodeType === 'excel' && (
            <SimpleForm
              className="col-span-12 grid grid-cols-12 gap-5"
              list={uploadList}
              onSubmit={handleSubmitExcelFile}
              values={excelFileValues}
              isLoading={isLoading}
              reference={childRef}
            />
          )}
        </div>
        <div className=" col-span-12 my-4 mt-4 flex-row ">
          <Search
            placeholder="جستجو"
            allowClear
            size="large"
            onSearch={handleSubmitSearch}
            style={{ width: 304 }}
          />
        </div>
        <div className=" border-2 border-grayBackground mt-10">
          <Table
            className="col-span-12"
            columns={tableHeader}
            withRow
            data={getAllServiceCodeState?.data}
            pageSize={pageSize}
            totalPages={getAllServiceCodeState?.pageInfo?.totalCount / pageSize}
            onChangePage={handlePageChange}
            pageNumber={pageNumber}
            // onChange={handleChangeTable}
          />
        </div>
      </div>
      <Modal
        handleOk={() => onOkModalDeleteClick()}
        handleCancel={() => setIsModalDeleteVisible(false)}
        isModalVisible={isModalDeleteVisible}
        title={`آیا نسبت به حذف کد خدمت انتخابی اطمینان دارید؟`}
      ></Modal>
    </div>
  );
}

export default withAlert(SetServicesCode);
