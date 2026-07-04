import { Button, Select, Image, Icon, Loading } from '@tse/components/atoms';
import type {
  ErrorType,
  HeaderTypes,
  onAlertProps,
  TableOnChange,
} from '@tse/types';
import {
  useEffect,
  useNavigate,
  useRef,
  useState,
  useStates,
} from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import MainProgressCard from 'apps/tax-front/src/components/MainProgressCard';
import ProgressCard from 'apps/tax-front/src/components/ProgressCard';
import { SimpleForm } from '@tse/components/molecules';
import type { ListType } from '@tse/types';
import { Table } from 'apps/tax-front/src/components/Table';
import { Modal } from 'antd';
import {
  getSettingTest,
  getFinishedInvoice,
  getActiveInvoice,
  getAllPeriod,
  searchInvoice,
  getInvalidModalData,
  getCurrentTableData,
} from './service';
import { Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { convertDateToJalali } from '@tse/tools';
const pageSize = 10;
interface ExpertDashboardTypes {
  onAlert: onAlertProps;
}
// const navigate = useNavigate();
const onclick = (item: any) => {
  console.log('itemitem', item);
};

const tableHeader: HeaderTypes[] = [
  {
    title: 'شرح',
    dataIndex: 'title',
    key: 'title',
    className: 'col-span-3',
    sorter: false,
    render: (item: any, record: any) => (
      <a
        // href={`/user/manager-invoice-details?desc=${item}&inty=${record?.inty}&sendDate=${record?.sendDate}&indicatorNumber=${record?.indicatorNumber}&periodId=${record?.periodId}`}
        href={`/user/invoice-details?desc=${item}&inty=${record?.inty}&sendDate=${record?.sendDate}&indicatorNumber=${record?.indicatorNumber}&periodId=${record?.periodId}&state=${record?.state}&orderId=${record?.orderId}`}
      >
        {item}
      </a>
    ),
  },
  {
    title: 'نوع ارسال',
    dataIndex: 'inty',
    key: 'inty',
    className: 'col-span-3',
    sorter: false,
    render: (item: any) => (
      <span>
        {item == 1
          ? 'نوع 1'
          : item == 2
          ? 'نوع 2'
          : item == 0
          ? 'نوع1 و نوع 2'
          : ''}
      </span>
    ),
  },
  {
    title: 'دوره',
    dataIndex: 'periodId',
    key: 'periodId',
    className: 'col-span-1',
    sorter: false,
    render: (_: any, record: any) => {
      return (
        <span>
          {convertDateToJalali(record?.startDate) +
            ' - ' +
            convertDateToJalali(record?.endDate)}
        </span>
      );
    },
  },
  {
    title: 'تاریخ ارسال',
    dataIndex: 'sendDate',
    key: 'sendDate',
    className: 'col-span-1',
    sorter: false,
    render: (item: any) => <span>{convertDateToJalali(item)}</span>,
  },
  {
    title: 'فرستنده',
    dataIndex: 'sentName',
    key: 'sentName',
    sorter: false,
    className: 'col-span-2',
    // render: (_: any, record: any) => {
    //   return <span></span>;
    // },
  },
  {
    title: 'گیرنده',
    dataIndex: 'confirmedName',
    key: 'confirmedName',
    className: 'col-span-1',
    sorter: false,
  },
  {
    title: 'شماره اندیکاتور',
    dataIndex: 'indicatorNumber',
    key: 'indicatorNumber',
    className: 'col-span-2',
    sorter: false,
  },
  {
    title: 'وضعیت',
    dataIndex: 'stateTitle',
    key: 'stateTitle',
    className: 'col-span-2',
    sorter: false,
  },
];
const tableCurrentHeader: HeaderTypes[] = [
  {
    title: 'شرح',
    dataIndex: 'periodTitle',
    key: 'periodTitle',
    className: 'col-span-3',
    sorter: false,
  },
  {
    title: 'نوع ارسال',
    dataIndex: 'inty',
    key: 'inty',
    className: 'col-span-3',
    sorter: false,
    render: (item: any) => (
      <span>
        {item == 1
          ? 'نوع 1'
          : item == 2
          ? 'نوع 2'
          : item == 0
          ? 'نوع1 و نوع 2'
          : ''}
      </span>
    ),
  },
  {
    title: 'دوره',
    dataIndex: 'periodId',
    key: 'periodId',
    className: 'col-span-1',
    sorter: false,
    render: (_: any, record: any) => {
      return (
        <span>
          {convertDateToJalali(record?.startDate) +
            ' - ' +
            convertDateToJalali(record?.endDate)}
        </span>
      );
    },
  },
  {
    title: 'تاریخ ارسال',
    dataIndex: 'sendDate',
    key: 'sendDate',
    className: 'col-span-1',
    sorter: false,
    render: (item: any) => <span>{convertDateToJalali(item)}</span>,
  },
  {
    title: 'فرستنده',
    dataIndex: 'senderGroupName',
    key: 'senderGroupName',
    sorter: false,
    className: 'col-span-2',
    // render: (_: any, record: any) => {
    //   return <span></span>;
    // },
  },
  {
    title: 'گیرنده',
    dataIndex: 'receiverGroupName',
    key: 'receiverGroupName',
    className: 'col-span-1',
    sorter: false,
  },
  {
    title: 'شماره اندیکاتور',
    dataIndex: 'indicatorNumber',
    key: 'indicatorNumber',
    className: 'col-span-2',
    sorter: false,
  },
  {
    title: 'وضعیت',
    dataIndex: 'stateTitle',
    key: 'stateTitle',
    className: 'col-span-2',
    sorter: false,
  },
];
const failModalTableHeader: HeaderTypes[] = [
  {
    title: 'نوع',
    dataIndex: 'type',
    key: 'type',
    className: 'col-span-2',
  },
  {
    title: 'خطا',
    dataIndex: 'error',
    key: 'error',
    className: 'col-span-2',
  },
  {
    title: 'تعداد',
    dataIndex: 'count',
    key: 'count',
    className: 'col-span-2',
  },
  {
    title: 'عملیات',
    dataIndex: 'operation',
    key: 'operation',
    className: 'col-span-2',
    render: (value: number) => (
      <a>
        <span className=" text-buttonBlue underline">ارسال مجدد</span>
      </a>
    ),
  },
  {
    title: 'فایل',
    dataIndex: 'file',
    key: 'file',
    className: 'col-span-1',
    render: (value: number) => (
      <a>
        <Icon name="icon-file-excel" classname=" text-green mr-1 text-lg" />
      </a>
    ),
  },
];

const detailModalTableHeader: HeaderTypes[] = [
  {
    title: 'نوع ارسال',
    dataIndex: 'sendType',
    key: 'sendType',
    className: 'col-span-1',
  },
  {
    title: 'تاریخ ارسال',
    dataIndex: 'sendDate',
    key: 'sendDate',
    className: 'col-span-2',
  },
  {
    title: 'تعداد رکورد',
    dataIndex: 'recordCount',
    key: 'recordCount',
    className: 'col-span-2',
  },
  {
    title: 'تعداد رکورد ارسال شده',
    dataIndex: 'sendRecordCount',
    key: 'sendRecordCount',
    className: 'col-span-2',
  },
  {
    title: 'تعداد رکورد مانده',
    dataIndex: 'remainRecordCount',
    key: 'remainRecordCount',
    className: 'col-span-2',
  },
];

const dataSource = [
  {
    key: '1',
    name: 'Mike',
    age: 32,
    address: '10 Downing Street',
  },
  {
    key: '2',
    name: 'John',
    age: 42,
    address: '10 Downing Street',
  },
  {
    key: '1',
    name: 'Mike',
    age: 32,
    address: '10 Downing Street',
  },
  {
    key: '2',
    name: 'John',
    age: 42,
    address: '10 Downing Street',
  },
  {
    key: '1',
    name: 'Mike',
    age: 32,
    address: '10 Downing Street',
  },
  {
    key: '2',
    name: 'John',
    age: 42,
    address: '10 Downing Street',
  },
];
const dataFail = [
  {
    type: 'fail',
    error: 'کد ملی',
    count: 42,
    file: 'file',
  },
  {
    type: 'fail',
    error: 'کد ملی',
    count: 42,
    file: 'file',
  },
  {
    type: 'fail',
    error: 'کد ملی',
    count: 42,
    file: 'file',
  },
];
const detailModalMockData = [
  {
    sendType: 'اصلی',
    sendDate: '1400/02/20',
    recordCount: 100,
    sendRecordCount: 50,
    remainRecordCount: 50,
  },
  {
    sendType: 'اصلی',
    sendDate: '1400/02/20',
    recordCount: 100,
    sendRecordCount: 50,
    remainRecordCount: 50,
  },
  {
    sendType: 'اصلی',
    sendDate: '1400/02/20',
    recordCount: 100,
    sendRecordCount: 50,
    remainRecordCount: 50,
  },
];
interface stateInterFace {
  failModalVisible?: boolean;
  detailsModalVisible?: boolean;
  invalidModalVisible?: boolean;
  finishedInvoice?: any;
  activeInvoice?: any;
  searchInvoiceData?: any;
  currentTableData?: any;
  inty?: any;
  periodId?: any;
  title?: any;
  indicatorNumber?: any;
  activeInvoiceLoading?: boolean;
}
const initialState = {
  failModalVisible: false,
  detailsModalVisible: false,
  invalidModalVisible: false,
  finishedInvoice: [],
  activeInvoice: [],
  searchInvoiceData: [],
  currentTableData: [],
  inty: 0,
  periodId: 0,
  title: '',
  indicatorNumber: 0,
  activeInvoiceLoading: false,
};
function ExpertDashboard({ onAlert }: ExpertDashboardTypes) {
  const [isLoading, setLoading] = useState<boolean>(false);
  const [arrowDisable, setArrowDisable] = useState(true);
  const [allPeriodData, setAllPeriodData] = useState<any>([]);
  const [pageNumber, setPageNumber] = useState<number | undefined>(1);
  const [pageNumberCurrentTable, setPageNumberCurrentTable] = useState<
    number | undefined
  >(1);

  const [sort, setSort] = useState<{
    AscSort?: boolean | '';
    SrtField?: string | number;
  }>({});
  const [pauseResumeState, setPauseResumeState] = useState(0);
  const [finishedInvoiceChange, setFinishedInvoiceChange] = useState(false);
  const [state, setState] = useStates<stateInterFace>(initialState);
  const {
    failModalVisible,
    detailsModalVisible,
    invalidModalVisible,
    finishedInvoice,
    activeInvoice,
    searchInvoiceData,
    currentTableData,
    inty,
    periodId,
    title,
    indicatorNumber,
    activeInvoiceLoading,
  } = state;
  const [changeTableMode, setChangeTableMode] = useState('cartable');

  const handleModeChange = (e: RadioChangeEvent) => {
    setChangeTableMode(e.target.value);
  };

  const ref = useRef(null);
  const formList: ListType[] = [
    {
      itemType: 'select',
      className: 'col-span-2',
      label: 'نوع ارسال',
      required: false,
      // require: 'دوره نمی تواند خالی باشد',
      name: 'inty',
      options: [
        { name: ' همه', value: 0 },
        { name: 'نوع 1', value: 1 },
        { name: 'نوع 2', value: 2 },
      ],
    },
    {
      itemType: 'select',
      className: 'col-span-2',
      label: 'دوره',
      required: false,
      // require: 'دوره نمی تواند خالی باشد',
      name: 'periodId',
      options: [
        { name: 'همه', value: 0 },
        ...allPeriodData?.map((item: any) => ({
          name: item?.title,
          value: parseInt(item?.id),
        })),
      ],
    },
    {
      itemType: 'input',
      className: 'col-span-2',
      label: 'شرح',
      required: false,

      // require: 'شرح نمی تواند خالی باشد',
      name: 'title',
    },
    {
      itemType: 'input',
      className: 'col-span-2',
      label: 'شماره اندیکاتور',
      required: false,
      // require: 'شماره اندیکاتور نمی تواند خالی باشد',
      name: 'indicatorNumber',
    },
    {
      itemType: 'button',
      value: 'جستجو',
      className: 'col-span-4 grid justify-end ',
      buttonClassName: 'bg-buttonBlue border-2 border-lightBlue',
      buttonTitleClassName: 'text-white',
    },
  ];
  useEffect(() => {
    handleGetSettingTest();
    handleGetFinishedInvoice();
    handleGetActiveInvoice();
    handleGetAllPeriod();
    handleGetSearchInvoice();
    handleGetCurrentTableData();
  }, []);
  useEffect(() => {
    handleGetActiveInvoice();
  }, [pauseResumeState]);
  useEffect(() => {
    handleGetFinishedInvoice();
  }, [finishedInvoiceChange]);

  useEffect(() => {
    handleGetSearchInvoice();
  }, [pageNumber, indicatorNumber, inty, periodId, title]);
  useEffect(() => {
    handleGetCurrentTableData();
  }, [pageNumberCurrentTable, indicatorNumber, inty, periodId, title]);
  function handleGetSettingTest() {
    setLoading(true);
    getSettingTest({
      onSuccess: (res) => {},
      onFail,
    });
  }
  function handleGetSearchInvoice() {
    setLoading(true);
    searchInvoice({
      indicatorNumber: indicatorNumber,
      periodId: periodId,
      title: title,
      inty: inty,
      pageSize: pageSize,
      pageNumber: pageNumber,
      onSuccess: (res) => {
        setState({ searchInvoiceData: res?.data });
      },
      onFail,
    });
  }
  function handleGetCurrentTableData() {
    setLoading(true);
    getCurrentTableData({
      indicatorNumber: indicatorNumber,
      periodId: periodId,
      title: title,
      inty: inty,
      pageNumber: pageNumberCurrentTable,
      pageSize: pageSize,
      onSuccess: (res) => {
        setState({ currentTableData: res?.data });
      },
      onFail,
    });
  }
  function handleGetInvalidModalData(periodId: any, indicatorNumber: any) {
    getInvalidModalData({
      periodId: periodId,
      indicatorNumber: indicatorNumber,
      onSuccess: (res) => {
        console.log('handleGetInvalidModalData', res);
      },
      onFail,
    });
  }
  function handleGetAllPeriod() {
    getAllPeriod({
      onSuccess: (res) => {
        setAllPeriodData(res?.data);
      },
      onFail,
    });
  }
  function handleGetFinishedInvoice() {
    setLoading(true);
    getFinishedInvoice({
      onSuccess: (res) => {
        setState({ finishedInvoice: res?.data });
      },
      onFail,
    });
  }
  function handleGetActiveInvoice() {
    setState({ activeInvoiceLoading: true });
    // setLoading(true);
    getActiveInvoice({
      onSuccess: (res) => {
        setState({ activeInvoice: res?.data, activeInvoiceLoading: false });
      },
      onFail,
    });
  }
  const onFail = (error: any) => {
    setLoading(false);
    onAlert?.({ message: error?.data?.message || error.data, ...error });
  };
  const handleHorizantalScroll = (
    element: any,
    speed: number,
    distance: number,
    step: number
  ) => {
    let scrollAmount = 0;
    const slideTimer = setInterval(() => {
      element.scrollLeft += step;
      scrollAmount += Math.abs(step);
      if (scrollAmount >= distance) {
        clearInterval(slideTimer);
      }
      if (element.scrollLeft === 0) {
        setArrowDisable(true);
      } else {
        setArrowDisable(false);
      }
    }, speed);
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
  function handlePageChange(PageNumber: number) {
    setPageNumber(PageNumber);
  }
  function handlePageChangeCurrentTable(PageNumber: number) {
    setPageNumberCurrentTable(PageNumber);
  }

  const onSubmitForm = (data: any) => {
    // const changeData = {
    //   indicatorNumber: parseInt(
    //     data?.indicatorNumber ? data?.indicatorNumber : 0
    //   ),
    //   inty: parseInt(data?.inty ? data?.inty : 0),
    //   periodId: parseInt(data?.periodId ? data?.periodId : 0),
    //   title: data?.title,
    // };
    setState({
      indicatorNumber: parseInt(
        data?.indicatorNumber ? data?.indicatorNumber : 0
      ),
      inty: parseInt(data?.inty ? data?.inty : 0),
      periodId: parseInt(data?.periodId ? data?.periodId : 0),
      title: data?.title,
    });
  };
  const onFailModalVisibleClick = (data: any) => {
    setState({ failModalVisible: true });
  };
  const onDetailsModalVisibleClick = (data: any) => {
    setState({ detailsModalVisible: true });
  };
  const onInvalidModalVisibleClick = (data: any) => {
    handleGetInvalidModalData(
      data?.allData?.periodId,
      data?.allData?.indicatorNumber
    );
    setState({ invalidModalVisible: true });
  };

  const FailModal = () => {
    return (
      <>
        <Modal
          visible={failModalVisible}
          onCancel={() => setState({ failModalVisible: false })}
          style={{ textAlign: 'center', padding: '0px' }}
          title={''}
          footer={null}
          centered
          width={800}
        >
          <div className="justify-center items-center mt-6">
            <Table
              className=""
              columns={failModalTableHeader}
              data={dataFail}
              pageSize={5}
              totalPages={1}
              onChangePage={() => console.log('')}
              onChange={() => console.log('')}
            />
            {/* <Image src={srcImage} className="" /> */}
          </div>
        </Modal>
      </>
    );
  };
  const InvalidModal = () => {
    return (
      <>
        <Modal
          visible={invalidModalVisible}
          onCancel={() => setState({ invalidModalVisible: false })}
          style={{ textAlign: 'center', padding: '0px' }}
          title={''}
          footer={null}
          centered
          width={800}
        >
          <div className="justify-center items-center mt-6">
            <Table
              className=""
              columns={failModalTableHeader}
              data={dataFail}
              pageSize={5}
              totalPages={1}
              onChangePage={() => console.log('')}
              onChange={() => console.log('')}
            />
            {/* <Image src={srcImage} className="" /> */}
          </div>
        </Modal>
      </>
    );
  };
  const DetailModal = () => {
    return (
      <>
        <Modal
          visible={detailsModalVisible}
          onCancel={() => setState({ detailsModalVisible: false })}
          style={{ textAlign: 'center', padding: '0px' }}
          title={''}
          footer={null}
          centered
          width={800}
        >
          <div className="justify-center items-center mt-6">
            <Table
              className=""
              columns={detailModalTableHeader}
              data={detailModalMockData}
              pageSize={5}
              totalPages={1}
              onChangePage={() => console.log('')}
              onChange={() => console.log('')}
            />
            {/* <Image src={srcImage} className="" /> */}
          </div>
        </Modal>
      </>
    );
  };
  const onStateChange = (state: any) => {
    setPauseResumeState(state);
  };
  const onFinishedInvoiceChange = () => {
    setFinishedInvoiceChange(!finishedInvoiceChange);
  };
  return (
    <div>
      <div className="bg-taxLightBlue px-6 py-3 grid grid-cols-12  mb-3 border-li">
        {activeInvoice.length > 0 && (
          <section className="2xl:col-span-3 xl:col-span-5 lg:col-span-7 md:col-span-12 m-8">
            {!activeInvoiceLoading ? (
              <MainProgressCard
                data={activeInvoice}
                onAlert={onAlert}
                onStateChange={onStateChange}
              />
            ) : (
              <div className="bg-white 2xl:w-[310px] w-[350px] px-4 py-4 rounded-lg flex items-center justify-center h-[470px] ">
                <Loading color="bg-buttonBlue" />
              </div>
            )}
          </section>
        )}

        {finishedInvoice.length > 0 && (
          <section
            className={`2xl:${
              activeInvoice.length > 0 ? 'col-span-9' : 'col-span-12'
            } xl:${
              activeInvoice.length > 0 ? 'col-span-7' : 'col-span-12'
            } lg:${
              activeInvoice.length > 0 ? 'col-span-5' : 'col-span-12'
            }  md:col-span-12`}
          >
            <div className="flex flex-1 flex-row justify-between my-5">
              <span className=" font-bold text-xl  ">بسته های ارسال شده</span>
              <div>
                <Icon
                  onClick={() => {
                    handleHorizantalScroll(ref.current, 25, 200, 10);
                  }}
                  name="icon-angle-circled-right"
                  classname=" text-2xl text-black"
                />
                <Icon
                  onClick={() => {
                    handleHorizantalScroll(ref.current, 25, 200, -10);
                  }}
                  name="icon-angle-circled-left"
                  classname=" text-2xl text-black "
                />
              </div>
            </div>
            <div ref={ref} className="flex flex-row overflow-x-hidden ">
              {finishedInvoice &&
                finishedInvoice.map((item: any, index: any) => (
                  <ProgressCard
                    data={item}
                    failModalVisibleClick={onFailModalVisibleClick}
                    detailsModalVisibleClick={onDetailsModalVisibleClick}
                    invalidModalVisibleClick={onInvalidModalVisibleClick}
                    onAlert={onAlert}
                    onFinishedInvoiceChange={onFinishedInvoiceChange}
                  />
                ))}
            </div>
          </section>
        )}
      </div>
      <div className="grid grid-cols-12 m-8 px-6 ">
        <span className="col-span-12 text-xl font-bold ">کارتابل</span>
        <div className="col-span-12 py-6 ">
          <SimpleForm
            list={formList}
            className="col-span-12 grid grid-cols-12 pl-2 gap-4"
            onSubmit={onSubmitForm}
          />
        </div>
      </div>
      <div className="px-6">
        <div className="m-8 border-2 border-grayBackground">
          <Radio.Group onChange={handleModeChange} value={changeTableMode}>
            <Radio.Button value="cartable">کارتابل</Radio.Button>
            <Radio.Button value="current">جاری</Radio.Button>
          </Radio.Group>
          {changeTableMode === 'cartable' && searchInvoiceData && (
            <Table
              className="py-6 col-span-12"
              columns={tableHeader}
              data={searchInvoiceData?.data}
              // data={dataSource}
              pageSize={pageSize}
              totalPages={searchInvoiceData?.pageInfo?.totalCount / pageSize}
              onChangePage={handlePageChange}
              pageNumber={pageNumber}
              onChange={handleChangeTable}
            />
          )}
          {changeTableMode === 'current' && (
            <Table
              className="py-6"
              columns={tableCurrentHeader}
              data={currentTableData?.data}
              pageSize={pageSize}
              pageNumber={pageNumberCurrentTable}
              totalPages={currentTableData?.pageInfo?.totalCount / pageSize}
              onChangePage={handlePageChangeCurrentTable}
              // onChange={() => console.log('')}
            />
          )}
        </div>
      </div>
      <FailModal />
      <InvalidModal />
      <DetailModal />
    </div>
  );
}
export default withAlert(ExpertDashboard);
