import { SimpleForm } from '@tse/components/molecules';
import { Icon, Button } from '@tse/components/atoms';
import { ListType, onAlertProps } from '@tse/types';
import { convertDateToJalali, deSeparator, separator } from '@tse/tools';
import {
  useEffect,
  useRecoilState,
  useRef,
  useState,
  useStates,
} from '@tse/utils';
import { userInfoAtom } from '../../../store/userProfile';
import { getOstanType, getTalarInfo, updateTalarInfo } from './service';
import withAlert from '../../../hoc/withAlert';

interface ProvinceDetailsTypes {
  onAlert: onAlertProps;
}

interface StatesType {
  ostanType?: { lst?: []; countAll?: number; pageNumber?: number };
}

interface TalarDetailsType {
  economic_Rate?: string;
  edalat_Count?: string;
  id?: string;
  inflation_Rate?: string;
  ostanTypeId?: string;
  ostanTypeName?: string;
  populstion?: string;
  sejam_Count?: string;
  start_Date?: string;
  talar_Address?: string;
  talar_Modir?: string;
  telNo?: string;
  unemployment_Rate?: string;
  talatTitle?: string;
  gdpShare?: any;
  literacyRate?: any;
}

const initial = {};
const initialState = { ostanType: {} };

function ProvinceDetails({ onAlert }: ProvinceDetailsTypes) {
  const [values, setValues] = useState<any>(initial);
  const [state, setState] = useStates<StatesType>(initialState);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [isEditMode, setEditMode] = useState<boolean>(false);
  const [info] = useRecoilState(userInfoAtom);
  const [talarDetails, setTalarDetails] = useState<TalarDetailsType>({});
  const childRef: any = useRef();
  useEffect(() => {
    if (info.talar_ID) {
      handleGetTalarInfo();
    }
  }, [info.talar_ID]);

  useEffect(() => {
    getOstanType({
      onFail,
      onSuccess: (res: any) => setState({ ostanType: res }),
    });
  }, []);

  function handleGetTalarInfo() {
    getTalarInfo({ id: info.talar_ID, onSuccess: setTalarDetails, onFail });
  }

  function handleEdit(values: any) {
    setEditMode(true);
    setValues(values);
    setTimeout(() => {
      setEditMode(false);
    }, 0);
  }

  function onSuccess() {
    childRef?.current?.onClear();
    setValues(initial);
    setLoading(false);
  }

  function handleSubmit({ id, ostanTypeName, ...params }: any) {
    setLoading(true);
    const data = {
      ...params,
      id: info.talar_ID,
    };
    updateTalarInfo({
      data,
      onSuccess: () => {
        setLoading(false);
        childRef?.current?.onClear();
        handleGetTalarInfo();
        onAlert({ message: 'اطلاعات با موفقیت ثبت شد', type: 'success' });
      },
      onFail,
    });
  }

  const onFail = (error: any) => {
    onAlert(error);
    const errors: any[] = Object.values(error?.data?.errors);
    // errors?.[0]?.map((message: any) => onAlert({ message }));
    setLoading(false);
  };

  const formList: ListType[] = [
    {
      name: 'talar_Modir',
      label: 'نام و نام خانوادگی مدیر (فارسی)',
      require: 'نام و نام خانوادگی را وارد کنید',
      inputWrapperClassName: 'group-focus-within:border-purple',
      className: 'col-span-3 lg:col-span-3 md:col-span-6',
    },
    {
      name: 'populstion',
      label: 'جمعیت استان',
      require: 'جمعیت استان را وارد کنید',
      type: 'numeric',
      inputWrapperClassName: 'group-focus-within:border-purple',
      className: 'col-span-3 lg:col-span-3 md:col-span-6',
      rule: {
        min: 1,
        max: 50_000_000,
      },
    },
    {
      name: 'start_Date',
      label: 'تاریخ افتتاح',
      require: 'تاریخ افتتاح را وارد کنید',
      inputWrapperClassName: 'group-focus-within:border-purple',
      className: 'col-span-3 lg:col-span-3 md:col-span-6',
      itemType: 'datePicker',
    },
    {
      name: 'telNo',
      label: 'شماره تماس',
      require: 'شماره تماس را وارد کنید',
      inputWrapperClassName: 'group-focus-within:border-purple',
      className: 'col-span-3 md:col-span-6',
      // type: 'number',
    },
    {
      name: 'sejam_Count',
      label: 'تعداد کدهای سجام استان',
      require: 'تعداد کدهای سجام استان را وارد کنید',
      inputWrapperClassName: 'group-focus-within:border-purple',
      className: 'col-span-3 md:col-span-6',
      type: 'numeric',
      rule: {
        min: 1,
        max: 50_000_000,
      },
    },
    {
      name: 'edalat_Count',
      label: 'تعداد سهامداران عدالت',
      require: 'تعداد سهامداران عدالت را وارد کنید',
      inputWrapperClassName: 'group-focus-within:border-purple',
      className: 'col-span-3 md:col-span-6',
      type: 'numeric',
    },
    // {
    //   name: 'edalat_Count_NS',
    //   label: 'تعداد سهامداران عدالت (غ.مستقیم)',
    //   require: 'تعداد سهامداران عدالت را وارد کنید',
    //   inputWrapperClassName: 'group-focus-within:border-purple',
    //   className: 'col-span-3 md:col-span-6',
    //   type: 'numeric',
    // },
    {
      name: 'talar_Address',
      label: 'آدرس',
      require: 'آدرس را وارد کنید',
      inputWrapperClassName: 'group-focus-within:border-purple',
      className: 'col-span-12',
    },
    {
      itemType: 'element',
      chidlren: (
        <h2 className="col-span-full text-lg font-medium">
          مشخصات اقتصادی استان
        </h2>
      ),
    },
    {
      name: 'ostanTypeId',
      label: 'نوع طبقه بندی استان',
      require: 'نوع طبقه بندی استان را وارد کنید',
      itemType: 'select',
      className: 'col-span-3',
      options: [
        { name: 'هیچکدام', value: '' },
        ...(state.ostanType?.lst?.map?.((item: any) => ({
          name: item.title,
          value: item.id,
        })) || []),
      ],
    },
    {
      name: 'economic_Rate',
      label: 'نرخ رشد اقتصادی استان',
      require: 'نرخ رشد اقتصادی استان را وارد کنید',
      type: 'float',
      className: 'col-span-3',
    },
    {
      name: 'unemployment_Rate',
      label: 'نرخ بیکاری',
      require: 'نرخ بیکاری را وارد کنید',
      type: 'float',
      className: 'col-span-3',
    },
    {
      name: 'inflation_Rate',
      label: 'نرخ تورم نقطه به نقطه',
      require: 'نرخ تورم نقطه به نقطه را وارد کنید',
      type: 'float',
      className: 'col-span-3',
    },
    {
      name: 'gdpShare',
      label: 'سهم از GDP',
      require: 'سهم از GDP را وارد کنید',
      type: 'float',
      className: 'col-span-3',
    },
    {
      name: 'literacyRate',
      label: 'نرخ باسوادی',
      require: 'نرخ باسوادی را وارد کنید',
      type: 'float',
      className: 'col-span-3',
    },
    {
      value: 'انصراف',
      type: 'submit',
      itemType: 'button',
      buttonTitleClassName: 'text-purple',
      onClick: onSuccess,
      tag: 'div',
      className: 'grid col-span-10 justify-end',
      buttonClassName: 'bg-white border-purple border-[1px] col-span-2',
    },
    {
      value: 'اعمال تغییرات',
      type: 'submit',
      itemType: 'button',
      buttonClassName: 'bg-purple col-span-12',
      className: 'col-span-2',
    },
  ];

  return (
    <>
      <div className="rounded shadow-simple px-6 py-3 grid grid-cols-12 gap-4 mb-3">
        <h2 className="col-span-full text-lg font-medium">مشخصات کلی استان</h2>
        <SimpleForm
          className="col-span-12 grid grid-cols-12 gap-5"
          list={formList}
          onSubmit={handleSubmit}
          values={values}
          reference={childRef}
          isLoading={isLoading}
          isEditMode={isEditMode}
        />
      </div>
      <Button
        className="p-4 flex items-center gap-2 !justify-start !h-[unset]"
        onClick={handleEdit.bind(null, talarDetails)}
      >
        <Icon name="icon-edit" classname="text-purple text-xl font-bold" />
        <span className="font-bold text-tiny text-purple">ویرایش</span>
      </Button>
      <div className="border-regionHallBorderTableGray border-[1px] rounded grid grid-cols-12">
        <div className="bg-regionHallTableGray p-4 col-span-12">
          <h3 className="text-lg">مشخصات استان</h3>
        </div>
        <section className="2xl:col-span-6 xl:col-span-12 lg:col-span-12 md:col-span-12 border-l-2 border-lightGray">
          <div className="p-4 grid grid-cols-12">
            <span className="font-bold text-tiny col-span-4">
              نام تالار - دفتر منطقه ای:
            </span>
            <span className="col-span-8">{talarDetails?.talatTitle}</span>
          </div>
          <div className="border-gray border-t-[1px] border-b-[1px] p-4 grid grid-cols-12">
            <span className="font-bold text-tiny col-span-4">جمعیت استان:</span>
            <span className="col-span-8">
              {separator(talarDetails?.populstion)}
            </span>
          </div>
          <div className="border-gray border-b-[1px] p-4 grid grid-cols-12">
            <span className="font-bold text-tiny col-span-4">
              تاریخ افتتاح:
            </span>
            <span className="text-tiny col-span-8">
              {convertDateToJalali(talarDetails?.start_Date)}
            </span>
          </div>
          <div className="p-4 grid grid-cols-12 border-gray border-b-[1px]">
            <span className="font-bold text-tiny col-span-4">آدرس:</span>
            <span className="text-tiny col-span-8">
              {talarDetails?.talar_Address}
            </span>
          </div>
        </section>
        <section className="2xl:col-span-6 xl:col-span-12 lg:col-span-12 md:col-span-12">
          <div className="p-4 grid grid-cols-12">
            <span className="font-bold text-tiny col-span-4">نام مدیر:</span>
            <span className="text-tiny col-span-8">
              {talarDetails?.talar_Modir}
            </span>
          </div>
          <div className="border-gray border-t-[1px] border-b-[1px] p-4 grid grid-cols-12">
            <span className="font-bold text-tiny col-span-4">شماره تماس:</span>
            <span className="text-tiny col-span-8">{talarDetails?.telNo}</span>
          </div>
          <div className="p-4 grid grid-cols-12">
            <span className="font-bold text-tiny col-span-4">
              تعداد سهامداران عدالت:
            </span>
            <span className="text-tiny col-span-8">
              {separator(talarDetails?.edalat_Count)}
            </span>
          </div>
          <div className="border-gray border-t-[1px] border-b-[1px] p-4 grid grid-cols-12">
            <span className="font-bold text-tiny col-span-4">
              تعداد کدهای سجام:
            </span>
            <span className="text-tiny col-span-8">
              {separator(talarDetails?.sejam_Count)}
            </span>
          </div>
          {/* <div className="p-4 grid grid-cols-12">
            <span className="font-bold text-tiny col-span-6">
              تعداد سهامداران عدالت (غیر مستقیم):
            </span>
            <span className="text-tiny col-span-6">
              {separator(talarDetails.edalat_Count_NS)}
            </span>
          </div> */}
        </section>
        <div className="bg-regionHallTableGray p-4 col-span-12">
          <h3 className="text-lg">مشخصات اقتصادی استان</h3>
        </div>
        <section className="2xl:col-span-6 xl:col-span-12 lg:col-span-12 md:col-span-12 border-l-2 border-lightGray">
          <div className="p-4 grid grid-cols-12 border-gray border-b-[1px]">
            <span className="font-bold text-tiny col-span-4">
              نوع طبقه بندی استان:
            </span>
            <span className="col-span-8">{talarDetails?.ostanTypeName}</span>
          </div>
          <div className="p-4 grid grid-cols-12 border-gray border-b-[1px]">
            <span className="font-bold text-tiny col-span-4">نرخ بیکاری:</span>
            <span className="text-tiny col-span-8">
              {talarDetails?.unemployment_Rate}%
            </span>
          </div>
          <div className="p-4 grid grid-cols-12 border-gray border-b-[1px] 2xl:border-b-0">
            <span className="font-bold text-tiny col-span-4">سهم از GDP:</span>
            <span className="text-tiny col-span-8">
              {talarDetails?.gdpShare}
            </span>
          </div>
        </section>
        <section className="2xl:col-span-6 xl:col-span-12 lg:col-span-12 md:col-span-12">
          <div className="p-4 grid grid-cols-12 border-gray border-b-[1px]">
            <span className="font-bold text-tiny col-span-4">
              نرخ رشد اقتصادی استان:
            </span>
            <span className="text-tiny col-span-8">
              {talarDetails?.economic_Rate}%
            </span>
          </div>
          <div className="p-4 grid grid-cols-12 border-gray border-b-[1px]">
            <span className="font-bold text-tiny col-span-4">
              نرخ تورم نقطه به نقطه:
            </span>
            <span className="text-tiny col-span-8">
              {talarDetails?.inflation_Rate}%
            </span>
          </div>
          <div className="p-4 grid grid-cols-12">
            <span className="font-bold text-tiny col-span-4">نرخ باسوادی:</span>
            <span className="text-tiny col-span-8">
              {talarDetails?.literacyRate}%
            </span>
          </div>
        </section>
      </div>
    </>
  );
}

export default withAlert(ProvinceDetails);
