import {
  useStates,
  useEffect,
  useNavigate,
  createSearchParams,
} from '@tse/utils';
import { getQueryParams } from '@tse/tools';
import Future from './Future';
import TradeOption from './TradeOption';
import Option from './Option';
import Debit from './Debit';
import Fund from './Fund';

const initialState = {
  activeTab: 1,
};

interface tabBarInterface {
  id: number;
  title: string;
}

const tabBarData: tabBarInterface[] = [
  {
    id: 1,
    title: 'اوراق آتی',
  },
  {
    id: 2,
    title: 'اختیار',
  },
  {
    id: 3,
    title: 'تبعی',
  },
  {
    id: 4,
    title: 'بدهی',
  },
  {
    id: 5,
    title: 'صندوق',
  },
];
export default function NewInstrument() {
  const navigate = useNavigate();
  const [state, setState] = useStates(initialState);
  const { activeTab } = state;

  const tab = getQueryParams('tab', window.location.href);
  const id = getQueryParams('id', window.location.href);

  useEffect(() => {
    setState({ activeTab: Number(tab) || 1 });
  }, [tab]);

  const handleModeChange = (id: number) => {
    setState({ activeTab: id });
    navigate({
      search: createSearchParams({
        tab: `${id}`,
      }).toString(),
    });
  };

  return (
    <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm flex flex-col min-h-[100vh]">
      {!id && (
        <div className="flex gap-6 border-b border-b-gray px-3 pt-2">
          {tabBarData.map((item: tabBarInterface) => {
            const border = activeTab === item.id && 'border-b-2 border-b-blue';
            return (
              <span
                className={`${border} pb-1 cursor-pointer`}
                onClick={() => handleModeChange(item.id)}
              >
                {item.title}
              </span>
            );
          })}
        </div>
      )}
      <div className="p-3">
        {activeTab === 1 && <Future />}
        {activeTab === 2 && <TradeOption />}
        {activeTab === 3 && <Option />}
        {activeTab === 4 && <Debit />}
        {activeTab === 5 && <Fund />}
      </div>
    </div>
  );
}
