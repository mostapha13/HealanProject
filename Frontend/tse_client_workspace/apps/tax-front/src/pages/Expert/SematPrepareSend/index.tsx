import { SimpleForm } from '@tse/components/molecules';
import { HeaderTypes, ListType, onAlertProps, TableOnChange } from '@tse/types';
import { useState, useEffect, useRef, useStates } from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import Item from 'antd/lib/list/Item';
import { TextField, Button } from '@tse/components/atoms';
import { Table } from 'apps/tax-front/src/components/Table';
import { DatePicker } from '@tse/components/molecules';
import {
  exportWrongSematData,
  getWrongSematData,
  updateWrongSematData,
} from './service';
import { start } from 'repl';
import { downloadFile } from '@tse/tools';
import { baseUrl } from 'apps/tax-front/src/constants';

interface SetSamatOffsetType {
  onAlert: onAlertProps;
}

const initialState = {
  startDate: '',
  endDate: '',
  startDateError: false,
  endDateError: false,
  pageNumber: 1,
  tableData: [],
  onReportClick: false,
};

function SamatPrepareToSend(props: SetSamatOffsetType) {
  const { onAlert } = props;
  const [values, setValues] = useState({});
  const [isLoading, setLoading] = useState(false);
  const [isUpdateLoading, setUpdateLoading] = useState(false);

  const [sort, setSort] = useState<{
    AscSort?: boolean | '';
    SrtField?: string | number;
  }>({});
  const [state, setState] = useStates<any>(initialState);
  const { startDate, endDate, pageNumber, tableData, onReportClick } = state;
  const childRef: any = useRef();
  const pageSize = 10;
  const tableHeader: HeaderTypes[] = [
    {
      title: 'نوع خطا',
      dataIndex: 'sematErrorTypeName',
      key: 'sematErrorTypeName',
      className: 'col-span-4',
    },
    {
      title: 'تعداد',
      dataIndex: 'count',
      key: 'count',
      className: 'col-span-4',
    },
    {
      title: 'دریافت فایل',
      dataIndex: 'sematErrorType',
      key: 'sematErrorType',
      className: 'col-span-4',
      render: (item: number, record: any) => (
        // <a onClick={() => onExportExcelClick(item, record?.sematErrorTypeName)}>
        <a
          href={
            baseUrl +
            `Semat/ExportWrongSematData?StartDate=${startDate}&EndDate=${endDate}&SematErrorType=${item}`
          }
          target="_blank"
          rel="noreferrer"
          className="text-tiny font-bold truncate"
        >
          <span className=" text-buttonBlue underline">فایل اکسل</span>
        </a>
      ),
    },
  ];
  const handlePageChange = (page: number) => {
    setState({ pageNumber: page });
  };
  function handleChangeTable(par?: TableOnChange) {
    const isSortType =
      par?.sorter?.order === 'ascend'
        ? true
        : par?.sorter?.order === 'descend'
        ? false
        : '';
    if (!par?.sorter?.order) {
      setSort({});
      return;
    }
    setSort({ AscSort: isSortType, SrtField: par?.sorter?.columnKey });
  }
  const onFail = (error: any) => {
    setLoading(false);
    onAlert(error);
  };
  const handleGetWrongSematData = () => {
    const data = {
      StartDate: startDate,
      EndDate: endDate,
    };
    getWrongSematData({
      data: data,
      onSuccess: (res) => {
        setState({ tableData: res, onReportClick: true });
        setLoading(false);
      },
      onFail,
    });
  };
  const handleSubmit = () => {
    setLoading(true);
    if (startDate && endDate) {
      handleGetWrongSematData();
    } else {
      setLoading(false);
      setState({
        ...(!startDate && { startDateError: true }),
        ...(!endDate && { endDateError: true }),
      });
    }
  };
  const onExportExcelClick = (sematErrorType: number, errorName: string) => {
    const data = {
      StartDate: startDate,
      EndDate: endDate,
      SematErrorType: sematErrorType,
    };
    exportWrongSematData({
      data: data,
      onSuccess: (res) => {
        downloadExportFile(res, 'فایل' + ' ' + errorName + '.xlsx');
      },
      onFail,
    });

    console.log(sematErrorType);
  };
  const handleUpdateSubmit = () => {
    setUpdateLoading(true);

    const data = {
      StartDate: startDate,
      EndDate: endDate,
    };
    updateWrongSematData({
      data: data,
      onSuccess: (res) => {
        setUpdateLoading(false);
        if (res?.data?.result) {
          onAlert({
            type: 'success',
            message: 'بروزرسانی اطلاعات با موفقیت انجام شد.',
          });
        } else {
          onAlert({
            type: 'error',
            message:
              'مشکلی در بروزرسانی اطلاعات  رخ داده است مجدد تلاش نمایید.',
          });
        }
        console.log('res', res);
      },
      onFail,
    });
  };
  const downloadExportFile = (data: any, name: any) => {
    if (data != null) {
      downloadFile(data, name);
    }
  };
  return (
    <div className="p-10">
      <div className="px-6">
        <h2 className="col-span-full text-lg font-medium border-b-2 py-4 border-lightGray">
          آماده‌‌سازی اطلاعات سمات
        </h2>
        <div className=" grid grid-cols-12 gap-4 py-10 px-4 mt-6 shadow-[0_0px_5px_rgba(0,0,0,0.2)]">
          <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2 z-10">
            <DatePicker
              label="از تاریخ"
              value={startDate}
              onChange={(value: any) =>
                setState({
                  startDate: value,
                  startDateError: false,
                })
              }
              required
              error={state?.startDateError}
            />
          </div>
          <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2 z-10">
            <DatePicker
              label="تا تاریخ"
              value={endDate}
              onChange={(value: any) =>
                setState({
                  endDate: value,
                  endDateError: false,
                })
              }
              required
              error={state?.endDateError}
            />
          </div>
          <div className="flex w-full items-center justify-center h-8">
            <Button
              isLoading={isLoading}
              onClick={handleSubmit}
              className="col-span-1 bg-buttonBlue mr-10 mt-2  w-full rounded  px-8 text-white"
            >
              گزارش
            </Button>
          </div>
        </div>
        {onReportClick && (
          <>
            <div className="gap-4 py-10 px-4 mt-6 shadow-[0_0px_5px_rgba(0,0,0,0.2)]">
              <Table
                className="py-6 col-span-12"
                columns={tableHeader}
                data={tableData}
                pageSize={pageSize}
                // totalPages={searchInvoiceData?.pageInfo?.totalCount / pageSize}
                onChangePage={handlePageChange}
                pageNumber={pageNumber}
                onChange={handleChangeTable}
              />
            </div>
            <div className="flex w-full items-center justify-center h-8">
              <Button
                isLoading={isUpdateLoading}
                onClick={handleUpdateSubmit}
                className="col-span-1 bg-buttonBlue mr-10  rounded mt-8  px-8 text-white w-[50%]"
              >
                بروزرسانی اطلاعات
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default withAlert(SamatPrepareToSend);
