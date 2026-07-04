import {
  Button,
  Select,
  Image,
  Icon,
  TextField,
  Upload,
} from '@tse/components/atoms';
import type { ErrorType, HeaderTypes, onAlertProps } from '@tse/types';
import {
  useEffect,
  useNavigate,
  useRef,
  useSearchParams,
  useState,
} from '@tse/utils';
import withAlert from '../../../../hoc/withAlert';
import { SimpleForm } from '@tse/components/molecules';
import type { ListType } from '@tse/types';
import { Table } from 'apps/tax-front/src/components/Table';
import { Modal, Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { FILE_BASE_URL } from 'apps/tax-front/src/constants';
import TextArea from 'antd/lib/input/TextArea';
import completeGif from 'apps/tax-front/src/assets/gif/complete.gif';
import inProgressGif from 'apps/tax-front/src/assets/gif/inProgress.gif';
import { uploader } from 'apps/tax-front/src/controller/Upload';
import {
  getExcelTransactionFee,
  getIndicatorNumber,
  sendAddendum,
} from './service';
import LoadingModal from 'apps/tax-front/src/components/Loading';
import { separator } from '@tse/tools';

interface SendPackageTypes {
  onAlert: onAlertProps;
}

function AddendumSend({ onAlert }: SendPackageTypes) {
  const [isCompleteModalVisible, setCompleteModalVisible] =
    useState<boolean>(false);
  const [isInProgressModalVisible, setInProgressModalVisible] =
    useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const [sendMessage, setSendMessage] = useState('');
  const [dataImportMode, setDataImportMode] = useState('excel');
  const [uploadFileValue, setUploadFileValue] = useState(null);
  const [uploadFileLink, setUploadFileLink] = useState('');
  const [uploadFileId, setUploadFileId] = useState('');
  const [excelSendType, setExcelSendType] = useState('1');
  const [sendFileLoading, setSendFileLoading] = useState(false);
  const [visibleLoading, setVisibleLoading] = useState(false);
  const [excelTranactionFee, setExcelTranactionFee] = useState<any[]>([]);
  const [indicatorNumberState, setIndicatorNumberState] = useState(0);
  const sendDate: any = searchParams.get('sendDate');
  const indicatorNumber: any = searchParams.get('indicatorNumber');
  const periodId: any = searchParams.get('periodId');
  const perriodTitle: any = searchParams.get('perriodTitle');
  const ref = useRef(null);
  const childRef: any = useRef();
  const uploadUrl = `${FILE_BASE_URL}Upload`;
  const navigate = useNavigate();

  // const onSubmitForm = (data: any) => {
  //   console.log('hiiii', data);
  // };
  // const formList: ListType[] = [
  // {
  //   itemType: 'select',
  //   className: 'col-span-2',
  //   label: 'نوع ارسال بسته',
  //   required: false,
  //   // require: 'نوع ارسال نمی تواند خالی باشد',
  //   name: 'packageType',
  // },
  // {
  //   itemType: 'select',
  //   className: 'col-span-2',
  //   label: 'دوره',
  //   required: false,
  //   // require: 'دوره نمی تواند خالی باشد',
  //   name: 'period',
  // },
  // {
  //   itemType: 'input',
  //   className: 'col-span-2',
  //   label: 'شرح',
  //   required: true,
  //   require: 'شرح نمی تواند خالی باشد',
  //   name: 'description',
  // },
  // {
  //   itemType: 'input',
  //   className: 'col-span-2',
  //   label: 'شماره اندیکاتور',
  //   required: true,
  //   require: 'شماره اندیکاتور نمی تواند خالی باشد',
  //   name: 'indicatorNumber',
  // },
  // {
  //   itemType: 'button',
  //   value: 'نمایش',
  //   className: 'col-span-6 grid justify-end ',
  //   buttonClassName: 'bg-buttonBlue border-2 border-lightBlue',
  //   buttonTitleClassName: 'text-white',
  // },
  // ];
  // const uploadList: ListType[] = [
  //   {
  //     name: 'type',
  //     label: 'نوع ارسال صورت حساب',
  //     require: 'نوع ارسال صورت حساب را وارد کنید',
  //     inputWrapperClassName: 'group-focus-within:border-purple',
  //     className: 'col-span-2',
  //     itemType: 'select',
  //     options: [
  //       { name: 'نوع 1', value: 'type1' },
  //       { name: 'نوع 2', value: 'type2' },
  //     ],
  //   },
  //   {
  //     name: 'tr_Files_Id',
  //     itemType: 'file',
  //     require: 'ارسال فایل اجباری است',
  //     inputWrapperClassName: 'group-focus-within:border-purple',
  //     className: 'col-span-2',
  //     link: `${FILE_BASE_URL}Download/`,
  //     uploadUrl,
  //     onFail,
  //     fileFormat: '.xlsx,.xls',
  //   },

  // {
  //   value: 'انصراف',
  //   type: 'submit',
  //   itemType: 'button',
  //   // buttonTitleClassName: 'text-purple',
  //   // onClick: onClear,
  //   tag: 'div',
  //   buttonClassName: 'bg-white border-purple border-[1px] col-span-2',
  //   className: 'grid col-span-10 justify-end',
  // },
  // {
  //   value: 'ثبت',
  //   type: 'submit',
  //   itemType: 'button',
  //   // buttonClassName: 'bg-purple',
  //   className: 'col-span-2',
  // },
  // ];

  // const textForm: ListType[] = [
  //   {
  //     name: 'description',
  //     label: 'شرح دستورالعمل',
  //     placeholder: 'شرح دستورالعمل',
  //     tag: 'textarea',
  //     require: 'شرح دستورالعمل را وارد کنید',
  //     // inputWrapperClassName: 'group-focus-within:border-purple',
  //     className: 'col-span-12',
  //   },
  // ];
  const tableHeaderExcel: HeaderTypes[] = [
    {
      title: 'تعداد رکورد',
      dataIndex: 'fileCount',
      key: 'fileCount',
      className: 'col-span-4',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'جمع مبلغ',
      dataIndex: 'transactionSum',
      key: 'transactionSum',
      className: 'col-span-4',
      render: (item: any) => <span>{separator(item)}</span>,
    },
  ];
  // useEffect(() => {
  //   handleGetIndicatorNumber();
  // }, []);
  // function handleGetIndicatorNumber() {
  //   getIndicatorNumber({
  //     onSuccess: (res) => {
  //       setIndicatorNumberState(res?.data?.currentIndicatorNumber);
  //     },
  //     onFail,
  //   });
  // }

  function onFail(error: ErrorType) {
    onAlert?.({ message: error?.data?.message || error.data, ...error });
  }
  const onDeleteFileClick = () => {
    setUploadFileValue(null);
    setUploadFileLink('');
    setUploadFileId('');
    setSendFileLoading(false);
  };
  const onChangeFile = (e: any) => {
    setVisibleLoading(true);
    const formData = e?.target?.files?.[0] as File;
    uploader({
      url: uploadUrl,
      file: formData,
      onSuccess: (res: any) => {
        setSendFileLoading(true);
        setUploadFileValue(res?.fileName);
        setUploadFileLink(res?.link);
        setUploadFileId(res?.fileId);
        getExcelTransactionFee({
          excelUrl: res?.fileId,
          periodId: periodId,
          onSuccess: (res) => {
            const arrayData = [];
            arrayData.push(res?.data);
            setExcelTranactionFee(arrayData);
            setVisibleLoading(false);
          },
          onFail,
        });
        onAlert({
          type: 'success',
          message: 'فایل با موفقیت آپلود گردید',
        });
      },
      onFail,
    });
  };
  const handleExcelSendType = (e: RadioChangeEvent) => {
    setExcelSendType(e.target.value);
  };
  function sendPackageFail(error: ErrorType) {
    onAlert?.({ message: error?.data?.message || error.data, ...error });
    setInProgressModalVisible(false);
    // setIsloading(false);
  }
  const onSuccessPackageSend = (res: any) => {
    setInProgressModalVisible(false);
    setCompleteModalVisible(true);
    setTimeout(() => {
      setCompleteModalVisible(false);
      navigate('/user/dashboard');
    }, 5000);
  };
  const onSendButtonClick = () => {
    sendAddendum({
      indicatorNumber: indicatorNumber,
      excelUrl: uploadFileId,
      periodId: periodId,
      inty: excelSendType,
      message: sendMessage,
      onSuccess: (res) => {
        onSuccessPackageSend(res);
      },
      onFail: (err: ErrorType) => {
        sendPackageFail(err);
      },
    });
    setInProgressModalVisible(true);
  };
  const CompleteModal = () => {
    return (
      <>
        <Modal
          visible={isCompleteModalVisible}
          closable={false}
          style={{ textAlign: 'center', padding: '0px' }}
          title={''}
          footer={null}
          centered
        >
          <div className="flex justify-center flex-col items-center">
            <Image className="w-[240px] h-[240px]" src={completeGif} alt="" />
            <span className=" font-bold mt-4">
              صورتحساب با موفقیت ارسال شد.
            </span>
            {/* <Image src={srcImage} className="" /> */}
          </div>
        </Modal>
      </>
    );
  };
  const InProgressModal = () => {
    return (
      <>
        <Modal
          visible={isInProgressModalVisible}
          closable={false}
          style={{ textAlign: 'center', padding: '0px' }}
          title={''}
          footer={null}
          centered
        >
          <div className="flex justify-center flex-col items-center">
            <Image className="w-[240px] h-[240px]" src={inProgressGif} alt="" />
            <span className=" font-bold mt-4">
              اطلاعات در حال ارسال می باشد.
            </span>
            {/* <Image src={srcImage} className="" /> */}
          </div>
        </Modal>
      </>
    );
  };

  return (
    <div className=" p-10 ">
      <div className=" px-6 py-3 grid grid-cols-12  mb-3 border-li shadow-[0_0px_5px_rgba(0,0,0,0.2)]">
        <span className=" col-span-12 border-b-2 border-lightGray text-base font-bold">
          ارسال فایل
        </span>
        <div className=" col-span-12 grid grid-cols-12 justify-between my-4 ">
          {/* <SimpleForm
              list={formList}
              className="col-span-12 grid grid-cols-12 pl-2 gap-4"
              onSubmit={onSubmitForm}
              values={sendMessage}
              reference={childRef}
              // isLoading={loading}
            /> */}
          <div className="col-span-2 flex mx-2">
            <TextField
              // onChange={field?.onChange}
              label="دوره"
              className="flex flex-1"
              readOnly
              value={perriodTitle}
            />
          </div>
          {/* <div className="col-span-2 flex mx-2">
            <TextField
              // onChange={field?.onChange}
              label="شرح"
              className="flex flex-1"
              readOnly
              value={'صورتحساب'}
            />
          </div> */}
          <div className="col-span-2 flex mx-2">
            <TextField
              // onChange={field?.onChange}
              label="شماره اندیکاتور"
              className="flex flex-1"
              readOnly
              value={indicatorNumber}
            />
          </div>
        </div>
        <div className="col-span-12 mt-12 border-t-2 border-lightGray pt-6">
          <span className="ml-6 font-bold">بارگذاری اطلاعات :</span>

          <div className="col-span-12 py-6 ">
            {/* <SimpleForm
              list={uploadList}
              className="col-span-12 grid grid-cols-12 pl-2 gap-4"
              onSubmit={onSubmitForm}
              reference={childRef}
            /> */}
            <div className="grid grid-cols-12 ">
              <Upload
                className="col-span-4"
                name={'cancelationExcel'}
                // label={'فایل جهت ابطال موارد'}
                onChange={(file: any) => onChangeFile(file)}
                value={uploadFileValue}
                onDelete={onDeleteFileClick}
                link={uploadFileLink}
                fileFormat=".xlsx,.xls"
              />
              <div className=" col-span-8 mt-6 px-20 flex-row ">
                <span className="ml-6 font-bold">الگوی ارسال :</span>
                <Radio.Group
                  defaultValue="1"
                  onChange={handleExcelSendType}
                  value={excelSendType}
                  style={{ marginBottom: 5 }}
                >
                  <Radio value="1">نوع 1</Radio>
                  <Radio value="2">نوع 2</Radio>
                </Radio.Group>
              </div>
            </div>
          </div>
        </div>
        {sendFileLoading ? (
          <div className=" col-span-12 flex flex-col ">
            {/* <div className=" col-span-12 flex flex-1 justify-between mt-8 mb-2">
              <span className="text-base font-bold">سرجمع اکسل</span>
              <div>
                <a>
                  <Icon
                    name="icon-file-excel"
                    classname=" text-green ml-1 text-lg"
                  />
                  <span className="text-base font-bold underline ">سرجمع</span>
                </a>
              </div>
            </div> */}
            <div className="border-2 border-grayBackground">
              <Table
                // className="mt-6"
                columns={tableHeaderExcel}
                data={excelTranactionFee}
                pageSize={1}
                totalPages={1}
                onChangePage={() => console.log('hiiii')}
                onChange={() => console.log('hooyy')}
              />
            </div>

            <div className=" col-span-12 flex flex-col   my-6 ">
              <span className="text-base font-bold col-span-12 mb-4">
                ارسال پیام
              </span>
              <TextField
                className="col-span-12 border-2 border-lightGray mt-2"
                onChange={(e: any) => setSendMessage(e)}
                label="متن پیام"
                value={sendMessage}
                type="text"
                // multiline
                // tag="textarea"
              />
            </div>
            <div className="col-span-12 flex flex-row items-center justify-end my-4">
              <Button
                onClick={() => onSendButtonClick()}
                className="text-white bg-buttonBlue  border-2 border-buttonBlue rounded-md px-4 mr-4 w-36 "
              >
                ارسال به مدیر
              </Button>
            </div>
          </div>
        ) : null}
      </div>
      <CompleteModal />
      <InProgressModal />
      <LoadingModal visible={visibleLoading} />
    </div>
  );
}
export default withAlert(AddendumSend);
