import { SimpleForm } from '@tse/components/molecules';
import { HeaderTypes, ListType, onAlertProps } from '@tse/types';
import { useState, useEffect, useRef } from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import { Radio, RadioChangeEvent } from 'antd';
import { Modal, Upload, Icon } from '@tse/components/atoms';
import { FILE_BASE_URL } from 'apps/tax-front/src/constants';
import { Table } from 'apps/tax-front/src/components/Table';
import {
  setBuyersCode,
  getAllBuyersCode,
  setExcelBuyersCode,
  deleteBuyersCode,
  searchBuyersCode,
  updateBuyersCode,
} from './service';
import { Input, Space } from 'antd';
const { Search } = Input;

interface SetBuyersCodeType {
  onAlert: onAlertProps;
}
const pageSize = 10;
function SetBuyersCode(props: SetBuyersCodeType) {
  const { onAlert } = props;
  const [values, setValues] = useState({});
  const [excelFileValues, setExcelFileValues] = useState({});
  const [isLoading, setLoading] = useState(false);
  const [buyersCodeType, setBuyersCodeType] = useState('manual');
  const [allBuyersCode, setAllBuyersCode] = useState<any>([]);
  const [isModalDeleteVisible, setIsModalDeleteVisible] = useState(false);
  const [deleteItemID, setDeleteItemID] = useState('');
  const [pageNumber, setPageNumber] = useState(1);

  const uploadUrl = `${FILE_BASE_URL}Upload`;

  const childRef: any = useRef();
  const onFail = (error: any) => {
    setLoading(false);
    onAlert({ type: 'error', message: error?.data?.message });
  };
  const tableHeader: HeaderTypes[] = [
    {
      title: 'کد حساب',
      dataIndex: 'accountCode',
      key: 'accountCode',
      className: 'col-span-3',
      sorter: false,
    },
    {
      title: 'نام شرکت',
      dataIndex: 'companyName',
      key: 'companyName',
      className: 'col-span-3',
      sorter: false,
    },
    {
      title: 'شناسه ملی',
      dataIndex: 'nationalCode',
      key: 'nationalCode',
      className: 'col-span-1',
      sorter: false,
    },
    {
      title: 'آدرس',
      dataIndex: 'address',
      key: 'address',
      className: 'col-span-4',
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
      name: 'accountCode',
      label: 'کد حساب',
      itemType: 'input',
      className: 'col-span-2',
      require: 'کد حساب را وارد کنید',
    },
    {
      name: 'companyName',
      label: 'نام شرکت',
      itemType: 'input',
      className: 'col-span-2',
      require: 'نام شرکت را وارد کنید',
    },

    {
      name: 'nationalCode',
      label: 'شناسه ملی',
      itemType: 'input',
      className: 'col-span-3',
      require: 'شناسه ملی را وارد کنید',
      type: 'number',
    },
    {
      name: 'address',
      label: 'آدرس',
      itemType: 'input',
      className: 'col-span-5',
      require: 'آدرس را وارد کنید',
    },
    {
      name: 'submit',
      value: 'ثبت',
      type: 'submit',
      itemType: 'button',
      buttonClassName: 'bg-buttonBlue',
      className: 'col-span-12 grid justify-end   ',
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
  const searchList: ListType[] = [
    {
      name: 'search',
      label: 'جستجو',
      itemType: 'input',
      className: 'col-span-2',
      require: 'جستحو',
    },
    {
      name: 'submit',
      value: 'جستجو',
      type: 'submit',
      itemType: 'button',
      buttonClassName: 'bg-buttonBlue',
      className: 'col-span-1 grid justify-end ',
    },
  ];
  useEffect(() => {
    handleGetAllBuyersCode();
  }, []);
  useEffect(() => {
    handleGetAllBuyersCode();
  }, [pageNumber]);
  const handleGetAllBuyersCode = () => {
    getAllBuyersCode({
      pageNumber: pageNumber,
      pageSize: pageSize,
      onSuccess: (res) => {
        setAllBuyersCode(res?.data);
      },
      onFail,
    });
  };
  function handleSubmit(param: any) {
    if (param.id) {
      updateBuyersCode({
        data: param,
        onSuccess: (res) => {
          if (res?.data?.isSuccess) {
            onAlert({
              type: 'success',
              message: 'کد خریدار با موفقیت به روزرسانی گردید',
            });
            handleGetAllBuyersCode();
          }
        },
        onFail,
      });
    } else {
      setBuyersCode({
        data: param,
        onSuccess: (res) => {
          if (res?.isSuccess) {
            onAlert({
              type: 'success',
              message: 'کد خریدار با موفقیت ثبت گردید',
            });
            handleGetAllBuyersCode();
          }
        },
        onFail,
      });
    }
  }
  function handleSubmitExcelFile(param: any) {
    setExcelBuyersCode({
      excelUrl: param?.tr_Files_Id?.fileId?.fileId,
      onSuccess: (res) => {
        if (res?.isSuccess) {
          onAlert({
            type: 'success',
            message: 'فایل اکسل کد خریدار با موفقیت ثبت گردید',
          });
          handleGetAllBuyersCode();
        }
      },
      onFail,
    });
  }
  function handleSubmitSearch(param: any) {
    searchBuyersCode({
      value: param,
      pageNumber: pageNumber,
      pageSize: pageSize,
      onSuccess: (res) => {
        setAllBuyersCode(res?.data);
      },
      onFail,
    });
  }
  const onOkModalDeleteClick = () => {
    deleteBuyersCode({
      id: parseInt(deleteItemID),
      onSuccess: (res) => {
        if (res?.data?.isSuccess) {
          onAlert({
            type: 'success',
            message: 'کد خریدار انتخابی با موفقیت حذف گردید',
          });
          handleGetAllBuyersCode();
          setIsModalDeleteVisible(false);
        }
      },
      onFail,
    });
  };
  const handleSetBuyersCode = (e: RadioChangeEvent) => {
    setBuyersCodeType(e.target.value);
  };
  const handlePageChange = (PageNumber: any) => {
    setPageNumber(PageNumber);
  };
  function handleEdit(values: any) {
    setValues(values);
  }

  return (
    <div className="p-10">
      <div className="px-6">
        <h2 className="col-span-full text-lg font-medium border-b-2 py-4 border-lightGray">
          تعریف کد خریداران
        </h2>
        <div className=" grid grid-cols-12 gap-4 py-10 px-4 mt-6 shadow-[0_0px_5px_rgba(0,0,0,0.2)]">
          <span className=" col-span-12 ">
            جهت تعریف کد خریداران می توانید از طریق بارگذاری اکسل یا دستی اقدام
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
            // addonBefore="https://"
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
            data={allBuyersCode?.data}
            pageSize={pageSize}
            totalPages={allBuyersCode?.pageInfo?.totalCount / pageSize}
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
        title={`آیا نسبت به حذف کد خریدار انتخابی اطمینان دارید؟`}
      ></Modal>
    </div>
  );
}

export default withAlert(SetBuyersCode);
