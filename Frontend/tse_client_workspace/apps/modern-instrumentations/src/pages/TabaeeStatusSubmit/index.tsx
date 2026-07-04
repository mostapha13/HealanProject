/* eslint-disable @typescript-eslint/no-empty-function */
import { Button, Icon, Loading } from '@tse/components/atoms';
import { SimpleForm } from '@tse/components/molecules';
import type { ListType, onAlertProps } from '@tse/types';
import {
  useEffect,
  useNavigate,
  useRecoilState,
  useRef,
  useResetRecoilState,
  useParams,
  useStates,
} from '@tse/utils';
import withAlert from '../../hoc/withAlert';
import { tabaeeStatusAtom } from '../../store/TabaeeStatus';
import {
  insertTabaeeStatus,
  deleteTabaeeStatus,
  getOneTabaeeStatus,
  updateTabaeeStatus,
  getInstrumentAll,
  handleGetAllData,
} from './service';

const INSTRUMENT_ALL_PAGE_SIZE = 6;

interface TabaeeStatusType {
  onAlert?: onAlertProps;
}

type ResultType = { lst?: any[]; countAll?: number; pageNumber?: number };
const responseArray: ResultType = { lst: [], countAll: 0, pageNumber: 0 };
interface StateType<T> {
  instrumentAll?: T;
  nasher?: T;
  sharayeteTasviehTahodatDarTarikhEmal?: T;
  ravesheTosigh?: T;
  hadafAzEnteshar?: T;
  instrumentAllForSahamTosigh?: T;
  instrumentStatus?: T;
  kargozareArzeKonande?: T;
  isLoading?: boolean;
}

const initialState = {
  instrumentAll: responseArray,
  instrumentAllForSahamTosigh: responseArray,
  sharayeteTasviehTahodatDarTarikhEmal: responseArray,
  ravesheTosigh: responseArray,
  hadafAzEnteshar: responseArray,
  kargozareArzeKonande: responseArray,
  nasher: responseArray,
  instrumentStatus: responseArray,
  isLoading: false,
};

function TabaeeStatusSubmit(props: TabaeeStatusType) {
  const { onAlert } = props;
  const navigate = useNavigate();
  const urlParam: any = useParams();
  const childRef: any = useRef();
  const [data, setData] = useRecoilState(tabaeeStatusAtom);
  const resetList = useResetRecoilState(tabaeeStatusAtom);
  const [state, setState] = useStates<StateType<ResultType>>(initialState);
  const {
    hadafAzEnteshar,
    nasher,
    sharayeteTasviehTahodatDarTarikhEmal,
    ravesheTosigh,
    instrumentStatus,
    kargozareArzeKonande,
  } = state;

  useEffect(() => {
    setState({ isLoading: true });
    handleGetAllData({
      onSuccess: async (result) => {
        const res = (await result) || [];
        setState({
          hadafAzEnteshar: res?.[0],
          nasher: res?.[1],
          sharayeteTasviehTahodatDarTarikhEmal: res?.[2],
          ravesheTosigh: res?.[3],
          kargozareArzeKonande: res?.[4],
          instrumentStatus: res?.[5],
        });
        handleGetOneTabaeeStatus();
        setState({ isLoading: false });
      },
      onFail,
    });
  }, []);

  function handleGetOneTabaeeStatus() {
    if (urlParam.id) {
      getOneTabaeeStatus({
        id: urlParam.id,
        onFail,
        onSuccess: (res: any) => {
          setData({
            ...res,
            bailedInstrumentIds: res.bailedInstrumentIds.map((item: any) => ({
              name: item.bailedInstrumentName,
              value: item.bailedInstrumentId,
            })),
          });
        },
      });
    }
    setState({ isLoading: false });
  }

  function onFail(error: any) {
    setState({ isLoading: false });
    onAlert?.({ message: error.data, error });
  }

  function onClear() {
    resetList();
    childRef?.current?.onClear();
    navigate('/dashboard/list');
  }

  function handleDeleteTabaeeStatus(id: number | string) {
    deleteTabaeeStatus({ id, onFail, onSuccess: onClear });
  }

  function handleSubmit({
    id,
    instrument,
    bailedInstrumentIds,
    ...param
  }: any) {
    setState({ isLoading: true });
    const data = {
      ...param,
      bailedInstrumentIds: bailedInstrumentIds?.map((item: any) => ({
        bailedInstrumentId: item.value || item,
      })),
      instrumentId: instrument?.id || param?.instrumentId,
      ...(urlParam.id && {
        id: urlParam.id,
      }),
    };
    if (urlParam.id) {
      updateTabaeeStatus({
        data,
        onFail,
        onSuccess: () => navigate('/dashboard/list'),
      });
      setState({ isLoading: false });
      return;
    }
    insertTabaeeStatus({
      data,
      onFail,
      onSuccess: () => navigate('/dashboard/list'),
    });
  }

  useEffect(() => {
    handleInstrumentAll();
  }, []);

  function handleInstrumentAll(PageNumber?: number) {
    getInstrumentAll({
      PageSize: INSTRUMENT_ALL_PAGE_SIZE,
      PageNumber,
      onFail,
      onSuccess: (res) =>
        setState({ instrumentAll: res, instrumentAllForSahamTosigh: res }),
    });
  }

  function onSearcher(Filter?: string) {
    getInstrumentAll({
      PageSize: INSTRUMENT_ALL_PAGE_SIZE,
      Filter,
      PageNumber: 1,
      onFail,
      onSuccess: (res) => setState({ instrumentAllForSahamTosigh: res }),
    });
  }

  const formList: ListType[] = [
    {
      className: 'grid grid-cols-12 col-span-4',
      label: 'نام نماد',
      name: 'instrument',
      itemType: 'modalSingleSelect',
      tableData: {
        ...{
          ...state.instrumentAll,
          lst:
            state?.instrumentAll?.lst?.map?.((item) => ({
              ...item,
              name: item?.symbol,
            })) || [],
        },
        pageSize: INSTRUMENT_ALL_PAGE_SIZE,
      },
      require: 'فیلد اجباری',
      onChangePage: handleInstrumentAll,
      inputWrapperClassName: '!cursor-pointer ',
      readOnly: true,
      modalTableHeader: [
        {
          title: 'نماد',
          dataIndex: 'symbol',
          key: 'symbol',
          className: 'col-span-10',
        },
      ],
    },
    {
      name: 'instrumentStatusId',
      label: 'وضعیت نماد',
      className: 'grid grid-cols-12 col-span-4',
      itemType: 'select',
      options: [
        { name: 'هیچکدام', value: '' },
        ...(instrumentStatus?.lst?.map((item: any) => ({
          name: item.name,
          value: item.id,
        })) as []),
      ],
    },
    {
      name: 'nasherId',
      label: 'ناشر',
      className: 'grid grid-cols-12 col-span-4',
      itemType: 'select',
      options: [
        { name: 'هیچکدام', value: '' },
        ...(nasher?.lst?.map(({ name, id }: any) => ({
          name,
          value: id,
        })) as []),
      ],
    },
    {
      name: 'kargozarArzeKonandeId',
      label: 'کارگزار عرضه کننده',
      className: 'col-span-4',
      itemType: 'select',

      options: [
        { name: 'هیچکدام', value: '' },
        ...(kargozareArzeKonande?.lst?.map((item: any) => ({
          name: item.name,
          value: item.id,
        })) as []),
      ],
    },
    {
      name: 'hadafAzEntesharId',
      label: 'هدف از انتشار',
      className: 'col-span-4',
      itemType: 'select',
      options: [
        { name: 'هیچکدام', value: '' },
        ...(hadafAzEnteshar?.lst?.map((item: any) => ({
          name: item.name,
          value: item.id,
        })) as []),
      ],
    },
    {
      name: 'shorooeMoamelat',
      itemType: 'datePicker',
      label: 'شروع معاملات',
      className: 'col-span-4',
    },
    {
      name: 'payaneMoamelat',
      itemType: 'datePicker',
      label: 'پایان معاملات',
      className: 'col-span-4',
    },
    {
      name: 'kolOragheGhabeleArze',
      label: 'کل اوراق قابل عرضه',
      className: 'grid grid-cols-12 col-span-4',
      type: 'numeric',
    },
    {
      name: 'tedadKolOraghPasAzAfzayesheSarmaye',
      label: 'تعداد کل اوراق',
      className: 'grid grid-cols-12 col-span-4',
      type: 'numeric',
    },
    {
      name: 'hajmeArzeShodeDarBazar',
      label: 'حجم عرضه شده در بازار',
      className: 'grid grid-cols-12 col-span-4',
      type: 'numeric',
    },
    {
      name: 'hajmArzeShodeDarBazar_Date',
      itemType: 'datePicker',
      label: 'حجم عرضه شده در بازار در تاریخ',
      className: 'col-span-4',
      type: 'numeric',
    },
    {
      name: 'darsadOragheArzeshodeBeKolOragheGhabeleArze',
      label: 'درصد اوراق عرضه شده به کل اوراق',
      className: 'grid grid-cols-12 col-span-4',
      type: 'float',
    },
    {
      name: 'darsadArzeHarSherkatBeKolBazar',
      label: 'درصد اوراق عرضه شده به کل بازار',
      className: 'grid grid-cols-12 col-span-4',
      type: 'float',
    },
    {
      name: 'arzesheTaminMali',
      label: 'ارزش تامین مالی',
      className: 'grid grid-cols-12 col-span-4',
      type: 'numeric',
    },
    {
      name: 'arzesheTaminMali_Date',
      label: 'ارزش تامین مالی تا تاریخ',
      className: 'col-span-4',
      itemType: 'datePicker',
    },
    {
      name: 'darsadAzKolTaminMali',
      label: 'درصد از کل تامین مالی',
      className: 'col-span-4',
      type: 'float',
    },
    {
      name: 'tarikhEmal',
      label: 'تاریخ اعمال',
      className: 'col-span-4',
      itemType: 'datePicker',
    },
    {
      name: 'saleSarResid',
      label: 'سال سررسید',
      className: 'col-span-4',
      type: 'number',
    },
    {
      name: 'salEnteshar',
      label: 'سال انتشار',
      className: 'col-span-4',
      type: 'number',
    },
    {
      name: 'gheymateEmal',
      label: 'قیمت اعمال (ریال)',
      className: 'col-span-4',
      type: 'numeric',
    },
    {
      name: 'geymateEmalTadilShodePasAzEghdameSherkati',
      label: 'قیمت اعمال تعدیل (ریال)',
      className: 'col-span-4',
      type: 'numeric',
    },
    {
      name: 'mablaghTaahodDarSarresidBarAsasMizanArzeShodeDarBazar',
      label: 'مبلغ تعهد در سررسید (ریال)',
      className: 'col-span-4',
      type: 'numeric',
    },
    {
      name: 'mablaghTaahodDarSarresidBarAsasMizanArzeShodeDarBazarMiliard',
      label: 'مبلغ تعهد در سررسید (میلیارد ریال)',
      className: 'col-span-4',
      type: 'numeric',
    },
    {
      name: 'darsadAzKolTahodIjadShode',
      label: 'درصد از کل تعهد ایجاد شده',
      className: 'col-span-4',
      type: 'float',
    },
    {
      name: 'mianginGheymatArzeEkhtiareForoosh',
      label: 'میانگین قیمت عرضه اختیار فروش (ریال)',
      className: 'col-span-4',
      type: 'numeric',
    },
    {
      name: 'mianginGheimatForoosheSaham',
      label: 'میانگین قیمت فروش سهام (ریال)',
      className: 'col-span-4',
      type: 'numeric',
    },
    {
      name: 'nerkhBazdehEsmi',
      label: 'نرخ بازده اسمی (درصد)',
      className: 'col-span-4',
      type: 'float',
    },
    {
      name: 'bazdehEsmiArzesheMali',
      label: 'بازده اسمی ارزش تامین مالی',
      className: 'col-span-4',
      type: 'numeric',
    },
    {
      name: 'nerkhBazdehMoaserTaminMali',
      label: 'نرخ بازده موثر تامین مالی (درصد)',
      className: 'col-span-4',
      type: 'float',
    },
    {
      name: 'bazdehMoaserArzeshTaminMali',
      label: 'بازده موثر تامین مالی',
      className: 'col-span-4',
      type: 'numeric',
    },
    {
      name: 'sharayeteTasviehTahodatDarTarikhEmalId',
      label: 'شرایط تسویه تعهدات در تاریخ اعمال',
      className: 'col-span-4',
      itemType: 'select',
      options: [
        { name: 'هیچکدام', value: '' },
        ...(sharayeteTasviehTahodatDarTarikhEmal?.lst?.map((item: any) => ({
          name: item.name,
          value: item.id,
        })) as []),
      ],
    },
    {
      name: 'ravesheTosighId',
      label: 'روش توثیق',
      className: 'col-span-4',
      itemType: 'select',
      options: [
        { name: 'هیچکدام', value: '' },
        ...(ravesheTosigh?.lst?.map((item: any) => ({
          name: item.name,
          value: item.id,
        })) as []),
      ],
    },
    {
      name: 'bailedInstrumentIds',
      label: 'سهام توثیق شده',
      className: 'col-span-4',
      itemType: 'selectMultiple',
      labelInValue: true,
      placeholder: 'سهام توثیق شده',
      filterOption: false,
      onSearch: onSearcher,
      limit: 50,
      options: [
        ...(state.instrumentAllForSahamTosigh?.lst?.map((item: any) => ({
          name: item.symbol,
          value: item.id,
        })) as []),
      ],
    },
    {
      name: 'tedadSahamJahateTosigh',
      label: 'تعداد سهام جهت توثیق',
      className: 'col-span-4',
    },
    {
      value: 'انصراف',
      type: 'submit',
      itemType: 'button',
      buttonTitleClassName: 'text-teal',
      onClick: onClear,
      tag: 'div',
      buttonClassName: 'bg-white border-teal border-[1px] col-span-2',
      className: 'grid col-span-10 justify-end',
    },
    {
      value: 'ثبت',
      type: 'submit',
      itemType: 'button',
      buttonClassName: 'bg-teal',
      className: 'col-span-2',
    },
  ];

  return (
    <>
      {urlParam.id && (
        <section className="flex justify-end">
          <Button
            className="flex flex-row items-center px-5 gap-x-2 py-1 border-[1px] border-red rounded"
            onClick={handleDeleteTabaeeStatus.bind(null, urlParam.id)}
          >
            <Icon name="icon-delete" classname="text-red" />
            حذف اطلاعات نماد
          </Button>
        </section>
      )}
      {state?.isLoading && (
        <section className="flex flex-1 justify-center items-center h-full">
          <Loading color="bg-teal" />
        </section>
      )}
      {!state?.isLoading && (
        <SimpleForm
          className="col-span-12 grid grid-cols-12 gap-7 mt-2"
          list={formList}
          onSubmit={handleSubmit}
          values={data}
          reference={childRef}
          isLoading={state?.isLoading}
        />
      )}
    </>
  );
}

export default withAlert(TabaeeStatusSubmit);
