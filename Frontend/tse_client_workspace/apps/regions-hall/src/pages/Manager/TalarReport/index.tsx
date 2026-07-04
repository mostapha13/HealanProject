import { Icon, TextField } from '@tse/components/atoms';
import { SimpleForm } from '@tse/components/molecules';
import { SymbolModal, Table } from '@tse/components/organism';
import {
  convertDateToJalali,
  downloadFile,
  getClickableLink,
  loadFromSession,
} from '@tse/tools';
import { HeaderTypes, ListType, onAlertProps, TableOnChange } from '@tse/types';
import { useRecoilState, useState, useEffect, useRef } from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import { userInfoAtom } from '../../../store/userProfile';
import {
  getTalarBanner,
  deleteTalarBanner,
  insertTalarBanner,
} from './service';
import {
  fileBaseUrl,
  uploadFileBaseUrl,
} from 'apps/regions-hall/src/constants';
import { downloadFileApi } from 'libs/components/atoms/src/lib/Upload/service';

interface AcceptedCompaniesTypes {
  onAlert: onAlertProps;
}

const PageSize = 100;

function PictureReport(props: AcceptedCompaniesTypes) {
  const { onAlert } = props;
  const childRef: any = useRef();
  const [info] = useRecoilState(userInfoAtom);
  const [state, setState] = useState({});
  const [Filter, setFilter] = useState<string>('');
  const [talarBanner, setTalarBanner] = useState<
    [
      {
        id?: string;
        createDate?: number;
        priority?: number;
        image?: string;
      }
    ]
  >([{}]);
  const [sort, setSort] = useState<{
    AscSort?: boolean | '';
    SrtField?: string | number;
  }>({});
  const [isLoading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState<number | undefined>(1);
  const uploadUrl = `${uploadFileBaseUrl}Upload`;
  const token = loadFromSession('token');

  const handlePageChange = (PageNumber: number) => {
    setPageNumber(PageNumber);
  };
  const handleGetTalarBanner = () => {
    getTalarBanner({
      onSuccess: setTalarBanner,
      onFail,
      TalarId: info?.talar_ID,
    });
  };

  useEffect(handleGetTalarBanner, []);

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

  function onClear() {
    setState({});
    childRef?.current?.onClear();
  }
  const onFail = (error: string) => {
    setLoading(false);
    onAlert({ error });
  };
  const tableHeader: HeaderTypes[] = [
    {
      dataIndex: 'priority',
      key: 'priority',
      title: 'اولویت نمایش',
      className: 'col-span-2 !justify-center',
      //   sorter: true,
    },
    {
      dataIndex: 'createDate',
      key: 'createDate',
      title: 'تاریخ',
      className: 'col-span-4 !justify-center',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
      //   sorter: true,
    },
    {
      dataIndex: 'image',
      key: 'image',
      title: 'فایل',
      className: 'col-span-4 !justify-center',
      render: (item: any, record: any) => (
        <a onClick={() => handleDownloadFile(item)}>
          <span>دانلود فایل</span>
        </a>
      ),
      //   sorter: true,
    },
    // {
    //   title: 'ویرایش',
    //   className: 'col-span-1 flex items-center',
    //   render: (_: any, record: any) => {
    //     return (
    //       <Icon
    //         name="icon-edit"
    //         classname=" cursor-pointer"
    //         onClick={() => handleEdit(record)}
    //       />
    //     );
    //   },
    // },
    {
      title: 'حذف',
      className: 'col-span-1 flex items-center',
      render: (_: any, record: any) => {
        return (
          <Icon
            name="icon-delete"
            classname="text-red cursor-pointer"
            onClick={() => handleDelete(record?.id)}
          />
        );
      },
    },
  ];

  const formList: ListType[] = [
    {
      name: 'periority',
      label: 'اولویت نمایش',
      require: 'اولویت نمایش را وارد کنید',
      color: 'purple',
      className: 'grid grid-cols-12 col-span-3 !text-right !items-start ',
      type: 'number',
    },
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
      //   fileFormat: '.xlsx,.xls',
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

  function handleEdit(values: any) {
    setState(values);
  }
  const handleDownloadFile = (file: any) => {
    downloadFileApi({
      guid: file?.fileId,
      baseUrl: fileBaseUrl,
      onSuccess: (res: any) => downloadExportFile(res, file?.fileName),
      onFail: (err: any) => console.log('onFail', err),
    });
  };
  const downloadExportFile = (data: any, name: any) => {
    if (data != null) {
      downloadFile(data, name);
    }
  };
  function handleDelete(id: any) {
    deleteTalarBanner({
      id,
      onSuccess: () => {
        handleGetTalarBanner();
        onAlert({ message: 'با موفقیت حذف شد', type: 'success' });
      },
      onFail,
    });
  }

  function handleSubmit(param: { periority: string; tr_Files_Id: any }) {
    setLoading(true);
    const data = {
      talarId: info.talar_ID,
      fileId: param?.tr_Files_Id?.fileId?.fileId,
      priority: parseFloat(param?.periority),
    };
    insertTalarBanner({
      data,
      onSuccess,
      onFail,
    });
  }

  const onSuccess = () => {
    childRef?.current?.onClear();
    onAlert({ type: 'success', message: 'با موفقیت ثبت شد' });
    handleGetTalarBanner();
    setLoading(false);
  };

  return (
    <>
      <div className="rounded shadow-simple px-6 py-3 grid grid-cols-12 gap-4">
        <h2 className="col-span-full text-lg font-medium">گزارش استان</h2>
        <SimpleForm
          className="col-span-12 grid grid-cols-12 gap-6"
          list={formList}
          onSubmit={handleSubmit}
          values={state}
          reference={childRef}
          isLoading={isLoading}
        />
      </div>
      <Table
        className="col-span-12  grid grid-cols-12"
        columns={tableHeader}
        data={talarBanner}
        isLoading={isLoading}
        pageSize={PageSize}
        // pageNumber={pageNumber}
        // totalPages={(companies?.countAll || 1) / PageSize}
        // onChangePage={handlePageChange}
        // onChange={handleChangeTable}
      />
    </>
  );
}

export default withAlert(PictureReport);
