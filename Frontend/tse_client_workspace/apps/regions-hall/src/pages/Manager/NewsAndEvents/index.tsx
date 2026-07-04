import { Icon, Image, TextField } from '@tse/components/atoms';
import { SimpleForm } from '@tse/components/molecules';
import { Table } from '@tse/components/organism';
import {
  convertDateToJalali,
  loadFromStorage,
  convertDateToJalaliHour,
  convertDateToDate,
  loadFromSession,
} from '@tse/tools';
import type {
  ListType,
  HeaderTypes,
  onAlertProps,
  TableOnChange,
  ErrorType,
  ResultType,
} from '@tse/types';
import { useEffect, useRecoilState, useRef, useState } from '@tse/utils';
import { fileBaseUrl, uploadFileBaseUrl } from '../../../constants';
import withAlert from '../../../hoc/withAlert';
import {
  deleteNews,
  getNews,
  getNewsCategory,
  insertNews,
  updateNews,
} from './service';
import { userInfoAtom } from '../../../store/userProfile';

const PageSize = 10;
const uploadUrl = `${uploadFileBaseUrl}Upload`;
const DATE = new Date().toLocaleDateString('sv-SE');
const DATETIME = new Date().toLocaleTimeString([], {
  timeStyle: 'short',
  hour12: false,
});

interface NewsAndEventsTypes {
  onAlert: onAlertProps;
}

const initial = {
  title: '',
  description: '',
};

export interface NewsDataLstType {
  id?: string;
  news_File_Name?: string;
  startDate?: string;
  ins_Tag?: string;
  news_File?: string;
  title?: string;
  news_File_Id?: { fileId?: { fileId: string } };
  news_Pic_Id?: { fileId?: { fileId: string } };
  news_Icon_Id?: { fileId?: { fileId: string } };
  description?: string;
  newsTag?: string[];
  talar_Id?: string;
  start_Date?: string;
  end_Date?: string | any;
  user_ID?: string;
  logo?: any;
  start_hour?: any;
  end_hour?: any;
}

function NewsAndEvents(props: NewsAndEventsTypes) {
  const { onAlert } = props;
  const token = loadFromSession('token');
  const [info] = useRecoilState(userInfoAtom);
  const [state, setState] = useState<any>(initial);
  const [Filter, setFilter] = useState<string>('');
  const [newsCategory, setNewsCategory] = useState<ResultType>({ lst: [] });
  const [loading, setIsloading] = useState<boolean>(false);
  const [isDateAvailable, setIsDateAvailable] = useState<boolean>(true);
  const [sort, setSort] = useState<{
    AscSort?: boolean | '';
    SrtField?: string | number;
  }>({});
  const [data, setData] = useState<ResultType>({ lst: [] });
  const childRef: any = useRef();
  const [pageNumber, setPageNumber] = useState<number | undefined>(1);
  const handleGetNews = () => {
    getNews?.({
      id: info?.talar_ID,
      PageSize,
      PageNumber: pageNumber,
      onFail,
      onSuccess: setData,
      AscSort: sort.AscSort,
      SrtField: sort.SrtField,
      Filter,
    });
  };

  const handlePageChange = (PageNumber: number) => {
    setPageNumber(PageNumber);
  };

  const handleGetNewsCategory = () => {
    getNewsCategory({ onFail, onSuccess: setNewsCategory });
  };

  useEffect(handleGetNewsCategory, []);

  useEffect(handleGetNews, [pageNumber, sort.AscSort, sort.SrtField, Filter]);

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

  const onFail = (error: ErrorType) => {
    onAlert?.({ message: error?.data?.message || error.data, ...error });
    setIsloading(false);
  };

  function onClear() {
    setIsDateAvailable(true);
    childRef?.current?.onClear();
    setState({});
  }

  const tableHeader: HeaderTypes[] = [
    {
      title: 'تصویر خبر',
      dataIndex: 'logo',
      key: 'logo',
      className: 'col-span-1',
    },
    {
      title: 'عنوان',
      dataIndex: 'title',
      key: 'title',
      className: 'col-span-2',
      sorter: true,
    },
    {
      title: 'تگ',
      dataIndex: 'newsTag',
      key: 'newsTag',
      className: 'col-span-2',
      sorter: true,
    },
    {
      title: 'دسته بندی',
      dataIndex: 'newsCategoryId',
      key: 'newsCategoryId',
      className: 'col-span-1',
      sorter: true,
      render: (i: any) => {
        const item = newsCategory.lst.find((p) => p.id === i);
        return <span>{item.name}</span>;
      },
    },
    {
      title: 'مدت زمان نمایش',
      dataIndex: 'start_Date',
      key: 'start_Date',
      className: 'col-span-2',
      sorter: true,
      render: (item: any) => {
        return <span>{item && `از: ${convertDateToJalali(item)}`}</span>;
      },
    },
    {
      title: '',
      dataIndex: 'end_Date',
      key: 'end_Date',
      className: 'col-span-1',
      render: (item: any) => {
        return <span>{item && `تا: ${convertDateToJalali(item)}`}</span>;
      },
    },
    {
      dataIndex: 'icon-edit',
      title: 'ویرایش',
      render: (_: any, record: any) => {
        return (
          <Icon
            name="icon-edit"
            classname=" cursor-pointer"
            onClick={() => handleEdit(record)}
          />
        );
      },
      className: 'col-span-1 flex items-center',
    },
    {
      title: 'حذف',
      className: 'col-span-1 flex items-center',
      render: (_: any, record: any) => {
        return (
          <Icon
            name="icon-delete"
            classname="text-red cursor-pointer"
            onClick={() => handleDelete(record)}
          />
        );
      },
    },
  ];

  const formList: ListType[] = [
    {
      name: 'title',
      label: 'تیتر خبر',
      require: 'تیتر خبر را وارد کنید',
      inputWrapperClassName: 'group-focus-within:border-purple',
      className: 'col-span-6',
    },
    {
      itemType: 'selectMultiple',
      label: 'تگ',
      name: 'newsTag',
      require: 'تگ خبر نمی تواند خالی باشد',
      className: 'col-span-3',
      mode: 'tags',
      placeholder: 'تگ خبر*',
    },
    {
      name: 'newsCategoryId',
      label: 'دسته بندی',
      require: 'دسته بندی را وارد کنید',
      className: 'col-span-3',
      itemType: 'select',
      options: [
        { name: 'هیچکدام', value: '' },
        ...newsCategory.lst.map((item) => ({
          name: item?.name ? item?.name : '',
          value: item?.id ? item?.id : '',
        })),
      ],
    },
    {
      name: 'description',
      label: 'شرح خبر',
      placeholder: 'شرح خبر',
      tag: 'textarea',
      require: 'شرح خبر را وارد کنید',
      className: 'col-span-12',
    },
    {
      name: 'news_File_Id',
      label: 'فایل پیوست',
      itemType: 'file',
      require: 'ارسال فایل پیوست اجباری است',
      className: 'col-span-5',
      link: `${fileBaseUrl}Download/`,
      uploadUrl,
      token,
      onFail,
    },
    {
      name: 'news_Pic_Id',
      label: 'تصویر خبر',
      itemType: 'file',
      require: 'ارسال تصویر خبر اجباری است',
      className: 'col-span-5',
      link: `${fileBaseUrl}Download/`,
      uploadUrl,
      token,
      onFail,
      fileFormat: '.jpg,.png,.jpeg',
    },

    {
      name: 'news_Icon_Id',
      label: 'لوگو',
      itemType: 'file',
      require: 'ارسال لوگو اجباری است',
      className: 'col-span-5',
      link: `${fileBaseUrl}Download/`,
      uploadUrl,
      token,
      onFail,
      fileFormat: '.jpg,.png,.jpeg',
    },
    {
      name: '',
      label: 'انتشار سریع',
      className: 'col-span-12',
      itemType: 'checkbox',
      onClick: () => setIsDateAvailable((prev) => !prev),
      checked: isDateAvailable,
    },
    {
      name: 'start_Date',
      label: 'از تاریخ',
      className: 'col-span-5',
      itemType: 'datePicker',
      ...(isDateAvailable && {
        value: DATE,
      }),
      // defaultValue: DATE,
      ...(!isDateAvailable && {
        require: 'تاریخ انتشار اجباری است',
      }),
      disabled: isDateAvailable,
    },
    {
      name: 'start_hour',
      label: 'از ساعت',
      className: 'col-span-5',
      // ...(!isDateAvailable && {
      //   require: 'ساعت انتشار اجباری است',
      // }),
      ...(isDateAvailable && {
        value: DATETIME,
      }),
      defaultValue: DATETIME,
      type: 'time',
      disabled: isDateAvailable,
    },
    {
      name: 'end_Date',
      label: 'تا تاریخ',
      className: 'col-span-5',
      itemType: 'datePicker',
      disabled: isDateAvailable,
    },
    {
      name: 'end_hour',
      label: 'تا ساعت',
      className: 'col-span-5',
      type: 'time',
      disabled: isDateAvailable,
    },
    {
      value: 'انصراف',
      type: 'submit',
      itemType: 'button',
      buttonTitleClassName: 'text-purple',
      onClick: onClear,
      tag: 'div',
      className: 'grid col-span-10 justify-end',
      buttonClassName: 'bg-white border-purple border-[1px] col-span-2',
    },
    {
      value: 'ثبت',
      type: 'submit',
      itemType: 'button',
      buttonClassName: 'bg-purple',
      className: 'grid col-span-2',
    },
  ];

  function handleDelete({ id }: any) {
    deleteNews({
      id,
      onSuccess: (result: any) => {
        handleGetNews();
        onAlert({ message: result.message, type: 'success' });
      },
      onFail,
    });
  }

  function handleEdit(values: any) {
    const data = {
      ...values,
      newsTag: values.newsTag.split(','),
      start_Date: convertDateToDate(values.start_Date),
      end_Date: convertDateToDate(values.end_Date),
    };
    setIsDateAvailable(false);
    setState(data);
  }

  function onSuccess() {
    setIsDateAvailable(true);
    childRef?.current?.onClear();
    onAlert({ type: 'success', message: 'اطلاعات با موفقیت ثبت شد' });
    handleGetNews();
    setIsloading(false);
  }

  const handleSubmit = ({
    logo,
    start_hour,
    end_hour,
    start_Date = DATE,
    end_Date,
    ...params
  }: NewsDataLstType) => {
    setIsloading(true);
    const data = {
      ...params,
      newsTag: params?.newsTag?.join(','),
      start_Date: isDateAvailable ? DATE : `${start_Date}T${start_hour}`,
      ...(end_Date && {
        end_Date: `${end_Date}${end_hour ? 'T' : ''}${end_hour}`,
      }),
      news_File_Id:
        params?.news_File_Id?.fileId?.fileId || params?.news_File_Id?.fileId,
      news_Pic_Id:
        params?.news_Pic_Id?.fileId?.fileId || params?.news_Pic_Id?.fileId,
      news_Icon_Id:
        params?.news_Icon_Id?.fileId?.fileId || params?.news_Icon_Id?.fileId,
      talar_Id: info?.talar_ID,
    };
    const startDateC = new Date(start_Date);
    const endDateC = new Date(end_Date);
    if (startDateC > endDateC) {
      onAlert?.({ message: 'تاریخ پایان نمی تواند کوچکتر از تاریخ شروع باشد' });
      return;
    }
    if (params.id) {
      updateNews({
        data,
        onSuccess,
        onFail,
      });
      return;
    }
    insertNews({
      data,
      onSuccess,
      onFail,
    });
  };

  const newData = data?.lst?.map((item: NewsDataLstType) => ({
    ...item,
    logo: (
      <Image
        className="col-span-3 shadow-simple"
        src={`${fileBaseUrl}Download/${item.news_Icon_Id}`}
        alt="خبر"
      />
    ),
    news_File_Id: {
      fileName: 'file',
      fileId: item.news_File_Id,
    },
    news_Pic_Id: {
      fileName: 'picture',
      fileId: item.news_Pic_Id,
    },
    news_Icon_Id: {
      fileName: 'logo',
      fileId: item.news_Icon_Id,
    },
    start_hour: convertDateToJalaliHour(item.start_Date),
    end_hour: convertDateToJalaliHour(item.end_Date),
  }));

  return (
    <>
      <div className="rounded shadow-simple px-6 py-3 grid grid-cols-12 gap-4">
        <h2 className="col-span-full text-lg font-medium">
          ثبت اخبار ، رویدادها و اطلاعیه ها
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
      <TextField
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
        isLoading={loading}
        onChange={handleChangeTable}
      />
    </>
  );
}

export default withAlert(NewsAndEvents);
