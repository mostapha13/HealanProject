/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { Table } from '@tse/components/organism';
import { SearchInput } from '@tse/components/molecules';
import { useEffect, useStates } from '@tse/utils';
import { getInstrumentList } from '../../../Controller';
import withAlert from '../../../hoc/withAlert';
import { HeaderTypes } from '@tse/types';

const initialState = {
  instrumentList: [],
  searchText: '',
};

const columns: HeaderTypes[] = [
  {
    title: 'نماد',
    dataIndex: 'symbol',
    className: 'col-span-3',
  },
  {
    title: 'نام نماد',
    dataIndex: 'symbolName',
    className: 'col-span-8 overflow-hidden',
  },
];

function Instrument({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const { instrumentList, searchText } = state;

  useEffect(() => {
    getSymbolList('', 1);
  }, []);

  const getSymbolList = (text: string, pageNo: number) => {
    const data = {
      SearchText: text,
      PageNumber: pageNo,
    };
    getInstrumentList({ data, onSuccess: onSuccessSymbolList, onFail });
  };

  const onSuccessSymbolList = (list: any) => {
    setState({
      instrumentList: list,
    });
  };

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSearch = (text: string) => {
    setState({
      searchText: text,
    });
    getSymbolList(text, 1);
  };

  const onChangePage = (pageNo: number) => {
    getSymbolList(searchText, pageNo);
  };
  return (
    <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3">
      <span className="font-bold">لیست نمادها</span>
      <div className="grid grid-cols-12 !mt-6">
        <SearchInput className=" col-span-5" onChange={onSearch} />
      </div>
      <Table
        columns={columns}
        data={instrumentList?.items}
        className="col-span-12 grid grid-cols-12 "
        wrapperClassName="!mt-6"
        onChangePage={onChangePage}
        totalPages={instrumentList?.totalPages}
        pageSize={10}
      />
    </div>
  );
}

export default withAlert(Instrument);
