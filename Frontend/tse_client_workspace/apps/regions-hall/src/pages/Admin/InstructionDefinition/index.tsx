import { Icon, Image, TextField } from '@tse/components/atoms';
import { SimpleForm } from '@tse/components/molecules';
import { Table } from '@tse/components/organism';
import {
  convertDateToDate,
  convertDateToJalali,
  convertDateToJalaliHour,
  loadFromStorage,
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
import { useEffect, useRef, useState } from '@tse/utils';
import { fileBaseUrl, uploadFileBaseUrl } from '../../../constants';
import withAlert from '../../../hoc/withAlert';
import {
  deleteInstructions,
  getInstructions,
  insertInstructions,
  updateInstructions,
} from './service';

const PageSize = 10;
const uploadUrl = `${uploadFileBaseUrl}Upload`;
const DATE = new Date().toLocaleDateString('sv-SE');

export interface InstructionDataLstType {
  id?: string;
  news_File?: string;
  title?: string;
  news_File_Name?: string;
  ins_Pic_Id?: string;
  ins_File_Id?: string;
  ins_Icon_Id?: string;
  description?: string;
  startDate?: string;
  ins_Tag?: string;
  talar_Id?: string;
  user_ID?: string;
}

interface InstructionDefinitionTypes {
  onAlert: onAlertProps;
}

const initial = {
  title: '',
  description: '',
};

function InstructionDefinition(props: InstructionDefinitionTypes) {
  const { onAlert } = props;
  const token = loadFromSession('token');
  const [Filter, setFilter] = useState<string>('');
  const [state, setState] = useState<any>(initial);
  const [loading, setIsloading] = useState<any>(false);
  const [isDateAvailable, setIsDateAvailable] = useState<boolean>(true);
  const [data, setData] = useState<ResultType>({ lst: [] });
  const childRef: any = useRef();
  const [pageNumber, setPageNumber] = useState<number | undefined>(1);
  const [sort, setSort] = useState<{
    AscSort?: boolean | '';
    SrtField?: string | number;
  }>({});

  const handlePageChange = (PageNumber: number) => {
    setPageNumber(PageNumber);
  };

  const handleGetInstructions = () => {
    getInstructions?.({
      PageSize,
      PageNumber: pageNumber,
      onFail,
      onSuccess: setData,
      AscSort: sort.AscSort,
      SrtField: sort.SrtField,
      Filter,
    });
  };

  useEffect(handleGetInstructions, [
    pageNumber,
    sort.SrtField,
    sort.AscSort,
    Filter,
  ]);

  const onFail = (error: ErrorType) => {
    onAlert?.({ message: error?.data?.message || error.data, ...error });
    setIsloading(false);
  };

  function onClear() {
    setIsDateAvailable(true);
    childRef?.current?.onClear();
    setState({});
  }

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

  const tableHeader: HeaderTypes[] = [
    {
      dataIndex: 'logo',
      key: 'logo',
      className: 'col-span-1',
    },
    {
      title: 'عنوان دستورالعمل',
      dataIndex: 'title',
      key: 'title',
      className: 'col-span-2',
      sorter: true,
    },

    {
      title: 'تگ',
      dataIndex: 'ins_Tag',
      key: 'ins_Tag',
      className: 'col-span-2',
      sorter: true,
    },
    {
      title: 'مدت زمان نمایش',
      dataIndex: 'startDate',
      key: 'startDate',
      className: 'col-span-2',
      sorter: true,
      render: (item: any) => {
        return <span>{item && `از: ${convertDateToJalali(item)}`}</span>;
      },
    },
    {
      title: '',
      dataIndex: 'endDate',
      key: 'endDate',
      className: 'col-span-2',
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
      label: 'عنوان دستورالعمل',
      require: 'عنوان دستورالعمل را وارد کنید',
      inputWrapperClassName: 'group-focus-within:border-purple',
      className: 'col-span-6',
    },
    {
      itemType: 'selectMultiple',
      className: 'col-span-3',
      label: 'تگ',
      name: 'ins_Tag',
      require: 'تگ نمی تواند خالی باشد',
      mode: 'tags',
      placeholder: 'تگ*',
    },
    {
      name: 'description',
      label: 'شرح دستورالعمل',
      placeholder: 'شرح دستورالعمل',
      tag: 'textarea',
      require: 'شرح دستورالعمل را وارد کنید',
      inputWrapperClassName: 'group-focus-within:border-purple',
      className: 'col-span-12',
    },
    {
      name: 'ins_File_Id',
      label: 'فایل پیوست',
      itemType: 'file',
      require: 'ارسال فایل اجباری است',
      className: 'col-span-5',
      link: `${fileBaseUrl}Download/`,
      uploadUrl,
      token,
      onFail,
    },
    {
      name: 'ins_Pic_Id',
      label: 'تصویر دستورالعمل',
      itemType: 'file',
      require: 'ارسال تصویر اجباری است',
      className: 'col-span-5',
      link: `${fileBaseUrl}Download/`,
      uploadUrl,
      token,
      onFail,
      fileFormat: '.jpg,.png,.jpeg',
    },
    {
      name: 'ins_Icon_Id',
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
      name: 'startDate',
      label: 'از تاریخ',
      className: 'col-span-5',
      ...(isDateAvailable && {
        value: DATE,
      }),
      ...(!isDateAvailable && {
        require: 'تاریخ اجباری است',
      }),
      // defaultValue: DATE,
      itemType: 'datePicker',
      disabled: isDateAvailable,
    },
    {
      name: 'start_hour',
      label: 'از ساعت',
      ...(!isDateAvailable && {
        require: 'ساعت انتشار اجباری است',
      }),
      ...(isDateAvailable && {
        value: '00:00',
      }),
      className: 'col-span-5',
      disabled: isDateAvailable,
      type: 'time',
    },
    {
      name: 'endDate',
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
      buttonClassName: 'bg-white border-purple border-[1px] col-span-2',
      className: 'grid col-span-10 justify-end',
    },
    {
      value: 'ثبت',
      type: 'submit',
      itemType: 'button',
      buttonClassName: 'bg-purple',
      className: 'col-span-2',
    },
  ];

  function handleDelete({ id }: any) {
    deleteInstructions({
      id,
      onSuccess: (result) => {
        handleGetInstructions();
        onAlert({ message: result.message, type: 'success' });
      },
      onFail,
    });
  }

  function handleEdit(values: any) {
    const data = {
      ...values,
      ins_Tag: values.ins_Tag.split(','),
      startDate: convertDateToDate(values.startDate),
      endDate: convertDateToDate(values.endDate),
    };
    setIsDateAvailable(false);
    setState(data);
  }

  function onSuccess(res: any) {
    setIsDateAvailable(true);
    childRef?.current?.onClear();
    onAlert({ type: 'success', message: res.message });
    handleGetInstructions();
    setIsloading(false);
  }

  const handleSubmit = ({
    logo,
    startDate = DATE,
    endDate,
    start_hour,
    end_hour,
    ...params
  }: any) => {
    setIsloading(true);
    const data = {
      ...params,
      ins_Tag: params.ins_Tag.join(','),
      startDate: isDateAvailable ? DATE : `${startDate}T${start_hour}`,
      ...(endDate && {
        endDate: `${endDate}T${end_hour || '00:00'}`,
      }),
      ins_File_Id:
        params.ins_File_Id.fileId.fileId || params.ins_File_Id.fileId,
      ins_Pic_Id: params.ins_Pic_Id.fileId.fileId || params.ins_Pic_Id.fileId,
      ins_Icon_Id:
        params?.ins_Icon_Id?.fileId.fileId || params?.ins_Icon_Id?.fileId,
    };
    const startDateC = new Date(startDate);
    const endDateC = new Date(endDate);
    if (startDateC > endDateC) {
      onAlert?.({ message: 'تاریخ پایان نمی تواند کوچکتر از تاریخ شروع باشد' });
      return;
    }
    if (params.id) {
      updateInstructions({
        data,
        onSuccess,
        onFail,
      });
      return;
    }
    insertInstructions({
      data,
      onSuccess,
      onFail,
    });
  };

  const newData = data?.lst?.map((item: any) => ({
    ...item,
    ins_File_Id: {
      fileName: 'file',
      fileId: item.ins_File_Id,
    },
    logo: (
      <Image
        className="col-span-3 shadow-simple"
        src={`${fileBaseUrl}Download/${item.ins_Icon_Id}`}
        alt="لوگو دستور العمل"
      />
    ),
    ins_Pic_Id: {
      fileName: 'picture',
      fileId: item.ins_Pic_Id,
    },
    ins_Icon_Id: {
      fileName: 'logo',
      fileId: item.ins_Icon_Id,
    },
    start_hour: convertDateToJalaliHour(item.startDate),
    end_hour: convertDateToJalaliHour(item.endDate),
  }));

  return (
    <>
      <div className="rounded shadow-simple px-6 py-3 grid grid-cols-12 gap-4">
        <h2 className="col-span-full text-lg font-medium">تعریف دستورالعمل</h2>
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

export default withAlert(InstructionDefinition);
