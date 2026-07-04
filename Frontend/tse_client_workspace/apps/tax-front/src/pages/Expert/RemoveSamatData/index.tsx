import { SimpleForm } from '@tse/components/molecules';
import { HeaderTypes, ListType, onAlertProps } from '@tse/types';
import { useState, useEffect, useRef } from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import { removeSematData, removeSematDataTable } from './service';
import { Table } from 'apps/tax-front/src/components/Table';
import {
  convertDateToJalali,
  convertDateToJalaliHour,
  separator,
} from '@tse/tools';
import LoadingModal from 'apps/tax-front/src/components/Loading';

interface RemoveSamatDataType {
  onAlert: onAlertProps;
}

const pageSize = 10;
function RemoveSamatData(props: RemoveSamatDataType) {
  const { onAlert } = props;
  const [values, setValues] = useState({});
  const [isLoading, setLoading] = useState(false);
  const childRef: any = useRef();
  const [pageNumber, setPageNumber] = useState(1);
  const [removeTableData, setRemoveTableData] = useState<any>([]);
  const [visibleLoading, setVisibleLoading] = useState(false);
  const formList: ListType[] = [
    {
      name: 'date',
      label: 'تاریخ',
      itemType: 'datePicker',
      className: 'col-span-2 ',
      require: 'تاریخ را وارد کنید',
    },
    {
      name: 'desc',
      label: 'توضیحات',
      itemType: 'input',
      className: 'col-span-5 mr-8',
      require: 'توضیخات را وارد کنید',
    },
    {
      name: 'submit',
      value: 'ثبت',
      type: 'submit',
      itemType: 'button',
      buttonClassName: 'bg-buttonBlue',
      className: 'col-span-5 grid justify-end ',
    },
  ];
  const tableHeader: HeaderTypes[] = [
    {
      title: 'تاریخ',
      dataIndex: 'date',
      key: 'date',
      className: 'col-span-2',
      sorter: false,
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'ساعت',
      dataIndex: 'date',
      key: 'date',
      className: 'col-span-2',
      sorter: false,
      render: (item: any) => <span>{convertDateToJalaliHour(item)}</span>,
    },

    {
      title: 'نام کاربر',
      dataIndex: 'userName',
      key: 'userName',
      className: 'col-span-2',
      sorter: false,
    },
    {
      title: 'تعداد رکورد',
      dataIndex: 'count',
      key: 'count',
      className: 'col-span-2',
      sorter: false,
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'سرجمع',
      dataIndex: 'sum',
      key: 'sum',
      className: 'col-span-2',
      sorter: false,
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'توضیحات',
      dataIndex: 'description',
      key: 'description',
      className: 'col-span-2',
      sorter: false,
    },
  ];
  useEffect(() => {
    handleRemoveSematDataTable();
    setVisibleLoading(true);
  }, []);
  const onFail = (error: any) => {
    setLoading(false);
    onAlert({ type: 'error', message: error?.data?.message });
    setVisibleLoading(false);
  };
  function handleSubmit(param: any) {
    console.log('param', param);
    setLoading(true);
    setVisibleLoading(true);
    onAlert({
      type: 'success',
      message:
        'فرآیند حذف اطلاعات آغاز گردید ممکن است این فرآیند دقایقی به طول انجامد!!!',
    });
    removeSematData({
      date: param?.date,
      description: param?.desc,
      onSuccess: (res) => {
        setLoading(false);

        if (res?.data?.isSuccess) {
          onAlert({
            type: 'success',
            message: 'اطلاعات سمات با موفقیت حذف گردید',
          });
        }
        setVisibleLoading(false);
      },
      onFail,
    });
  }
  function handleRemoveSematDataTable() {
    removeSematDataTable({
      pageNumber: pageNumber,
      pageSize: pageSize,
      onSuccess: (res) => {
        setLoading(false);

        if (res?.isSuccess) {
          setRemoveTableData(res?.data);
        }
        setVisibleLoading(false);
      },
      onFail,
    });
  }
  const handlePageChange = (PageNumber: any) => {
    setPageNumber(PageNumber);
  };
  return (
    <div className="p-10">
      <div className="px-6">
        <h2 className="col-span-full text-lg font-medium border-b-2 py-4 border-lightGray">
          ابطال اطلاعات سمات
        </h2>
        <div className=" grid grid-cols-12 gap-4 py-10 px-4 mt-6 shadow-[0_0px_5px_rgba(0,0,0,0.2)]">
          <SimpleForm
            className="col-span-12 grid grid-cols-12 gap-5"
            list={formList}
            onSubmit={handleSubmit}
            values={values}
            isLoading={isLoading}
            reference={childRef}
          />
        </div>
        <div className=" border-2 border-grayBackground mt-10">
          <Table
            className="col-span-12"
            columns={tableHeader}
            withRow
            data={removeTableData?.data}
            pageSize={pageSize}
            totalPages={removeTableData?.pageInfo?.totalCount / pageSize}
            onChangePage={handlePageChange}
            pageNumber={pageNumber}
            // onChange={handleChangeTable}
          />
        </div>
      </div>
      <LoadingModal visible={visibleLoading} />
    </div>
  );
}

export default withAlert(RemoveSamatData);
