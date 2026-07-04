import { Icon, TextField } from '@tse/components/atoms';
import { SimpleForm } from '@tse/components/molecules';
import { Table } from '@tse/components/organism';
import {
  lastYearsGenerator,
  generateMonths,
  loadFromStorage,
  monthGenerator,
  loadFromSession,
} from '@tse/tools';
import type {
  ErrorType,
  HeaderTypes,
  ListType,
  onAlertProps,
  TableOnChange,
} from '@tse/types';
import { useEffect, useRecoilState, useState, useRef } from '@tse/utils';
import { fileBaseUrl, uploadFileBaseUrl } from '../../../constants';
import withAlert from '../../../hoc/withAlert';
import { userInfoAtom } from '../../../store/userProfile';
import { insertTradingStatistics } from './service';

const PageSize = 10;
const uploadUrl = `${uploadFileBaseUrl}Upload`;

interface TradingStatisticsTypes {
  onAlert: onAlertProps;
}

const initial = {
  tr_Year: '',
  tr_Month: '',
};

function TradingStatistics(props: TradingStatisticsTypes) {
  const { onAlert } = props;
  const [state, setState] = useState<any>(initial);
  const [Filter, setFilter] = useState<string>('');
  const token = loadFromSession('token');
  const [sort, setSort] = useState<{
    AscSort?: boolean | '';
    SrtField?: string | number;
  }>({});
  const [info] = useRecoilState(userInfoAtom);
  const [loading, setIsloading] = useState(false);
  const childRef: any = useRef();
  const [data, setData] = useState<{
    lst?: any[];
    countAll?: number;
    pageNumber?: number;
  }>({});
  const [pageNumber, setPageNumber] = useState<number | undefined>(1);
  console.log('info', info);
  const userTalars = info?.userTalars?.map((item: any) => ({
    name: item.talarName,
    value: item.talar_ID,
  }));

  function handlePageChange(PageNumber: number) {
    setPageNumber(PageNumber);
  }

  // function handleTradingStatistics() {
  //   getTradingStatistics?.({
  //     PageSize,
  //     PageNumber: pageNumber,
  //     onFail,
  //     onSuccess: setData,
  //     AscSort: sort.AscSort,
  //     SrtField: sort.SrtField,
  //     TalarId: info.talar_ID,
  //     Filter,
  //   });
  // }

  // useEffect(handleTradingStatistics, [
  //   pageNumber,
  //   sort.AscSort,
  //   sort.SrtField,
  //   Filter,
  // ]);

  function onFail(error: ErrorType) {
    onAlert?.({ message: error?.data?.message || error.data, ...error });
    setIsloading(false);
  }

  // function handleEdit(values: any) {
  //   setState(values);
  // }

  // function handleChangeTable(par?: TableOnChange) {
  //   const isSortType =
  //     par?.sorter?.order === 'ascend'
  //       ? true
  //       : par?.sorter?.order === 'descend'
  //       ? false
  //       : '';
  //   if (!par?.sorter?.order) {
  //     setSort({});
  //     return;
  //   }
  //   setSort({ AscSort: isSortType, SrtField: par?.sorter?.columnKey });
  // }

  function onClear() {
    childRef?.current?.onClear();
    setState({});
  }

  // const tableHeader: HeaderTypes[] = [
  //   {
  //     title: 'عنوان',
  //     dataIndex: 'link',
  //     key: 'link',
  //     className: 'col-span-5',
  //     sorter: true,
  //   },
  //   {
  //     title: 'سال',
  //     dataIndex: 'tr_Year',
  //     key: 'tr_Year',
  //     className: 'col-span-2',
  //     sorter: true,
  //   },
  //   {
  //     title: 'ماه',
  //     dataIndex: 'tr_Month',
  //     key: 'tr_Month',
  //     className: 'col-span-2',
  //     sorter: true,
  //     // render: (_: any, record: any) => {
  //     //   return <span>{record.tr_Year}</span>;
  //     // },
  //   },
  //   {
  //     dataIndex: 'icon-edit',
  //     title: 'ویرایش',
  //     render: (_: any, record: any) => {
  //       return (
  //         <Icon
  //           name="icon-edit"
  //           classname=" cursor-pointer"
  //           onClick={() => handleEdit(record)}
  //         />
  //       );
  //     },
  //     className: 'col-span-1 flex items-center',
  //   },
  //   {
  //     title: 'حذف',
  //     className: 'col-span-1 flex items-center',
  //     render: (_: any, record: any) => {
  //       return (
  //         <Icon
  //           name="icon-delete"
  //           classname="text-red cursor-pointer"
  //           onClick={() => handleDelete(record)}
  //         />
  //       );
  //     },
  //   },
  // ];

  const formList: ListType[] = [
    {
      name: 'talarId',
      label: 'نام تالار',
      require: 'سال را وارد کنید',
      inputWrapperClassName: 'group-focus-within:border-purple',
      className: 'col-span-4 ml-4',
      itemType: 'select',
      options: [{ name: 'هیچکدام', value: '' }, ...userTalars],
    },
    // {
    //   name: 'tr_Month',
    //   label: 'ماه',
    //   require: 'ماه را وارد کنید',
    //   inputWrapperClassName: 'group-focus-within:border-purple',
    //   className: 'col-span-3',
    //   itemType: 'select',
    //   options: [{ name: 'هیچکدام', value: '' }, ...monthGenerator()],
    // },
    {
      name: 'tr_Files_Id',
      itemType: 'file',
      require: 'ارسال فایل اجباری است',
      inputWrapperClassName: 'group-focus-within:border-purple',
      className: 'col-span-6',
      link: `${fileBaseUrl}Download/`,
      uploadUrl,
      token,
      onFail,
      fileFormat: '.xlsx,.xls',
    },
    {
      value: 'انصراف',
      type: 'submit',
      itemType: 'button',
      buttonTitleClassName: 'text-purple',
      onClick: onClear,
      tag: 'div',
      buttonClassName: 'bg-white border-purple border-[1px] col-span-2',
      className: 'grid col-span-10 justify-end mt-6',
    },
    {
      value: 'ثبت',
      type: 'submit',
      itemType: 'button',
      buttonClassName: 'bg-purple',
      className: 'col-span-2 mt-6',
    },
  ];

  // function handleDelete({ id }: any) {
  //   deleteTradingStatistics({
  //     id,
  //     onSuccess: () => {
  //       handleTradingStatistics();
  //       onAlert({ message: 'با موفقیت حذف شد', type: 'success' });
  //     },
  //     onFail,
  //   });
  // }

  function onSuccess() {
    childRef?.current?.onClear();
    onAlert({ type: 'success', message: 'اطلاعات با موفقیت ثبت شد' });
    // handleTradingStatistics();
    setIsloading(false);
  }

  const handleSubmit = ({ link, ...params }: any) => {
    setIsloading(true);
    const data = {
      // ...params,
      talarId: params?.talarId,
      fileId: params?.tr_Files_Id?.fileId.fileId || params?.tr_Files_Id?.fileId,
    };
    // if (params.id) {
    //   updateTradingStatistics({
    //     data,
    //     onSuccess,
    //     onFail,
    //   });
    //   return;
    // }
    console.log('dataaaa', data);
    console.log('params', params);

    insertTradingStatistics({
      data,
      onSuccess,
      onFail,
    });
  };

  // const newData = data?.lst?.map((item: any) => ({
  //   ...item,
  //   link: (
  //     <a href={`${fileBaseUrl}Download/${item.tr_Files_Id}`}>
  //       آمار معاملات مربوط به سال {item.tr_Year} و ماه{' '}
  //       {generateMonths(item.tr_Month)}
  //     </a>
  //   ),
  //   tr_Files_Id: {
  //     fileName: 'file',
  //     fileId: item.tr_Files_Id,
  //   },
  // }));
  return (
    <>
      <div className="rounded shadow-simple px-6 py-6 grid grid-cols-12 gap-4">
        <h2 className="col-span-full text-lg font-medium">
          ثبت آمار معاملات بورس
        </h2>
        <SimpleForm
          className="col-span-12 grid grid-cols-12 gap-5"
          list={formList}
          onSubmit={handleSubmit}
          values={state}
          reference={childRef}
          isLoading={loading}
        />
      </div>
      {/* <TextField
        className="!my-3"
        type="text"
        label="جستجو"
        onChange={setFilter}
        iconName="icon-search"
      />
      <Table
        className="col-span-12 border-lightPurple grid grid-cols-12"
        columns={tableHeader}
        data={newData}
        totalPages={(data?.countAll || 1) / PageSize}
        pageSize={PageSize}
        onChangePage={handlePageChange}
        pageNumber={pageNumber}
        onChange={handleChangeTable}
      /> */}
    </>
  );
}

export default withAlert(TradingStatistics);
