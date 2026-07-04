/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { Icon } from '@tse/components/atoms';
import { Table } from '@tse/components/organism';
import { SearchInput, SimpleForm } from '@tse/components/molecules';
import { saveFund, getFundList, removeFund } from '../../../Controller';
import { useEffect, useState, useRef } from '@tse/utils';
import { Popconfirm } from 'antd';
import { ListType, HeaderTypes } from '@tse/types';
import withAlert from '../../../hoc/withAlert';

function MarketingFund({ onAlert }: any) {
  const [fundList, setFundList] = useState<any>(null);
  const childRef: any = useRef();
  const [state, setState] = useState({});
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    getList(1, '');
  }, []);

  const tableHeader: HeaderTypes[] = [
    {
      title: 'نام صندوق',
      dataIndex: 'fundName',
      key: '',
      className: 'col-span-9',
    },
    {
      title: 'ویرایش',
      key: 'action',
      className: 'col-span-1',
      render: (_: any, record: any) => (
        <Icon
          name="icon-edit"
          classname="cursor-pointer"
          onClick={() => onEdit(record)}
        />
      ),
    },
    {
      title: 'حذف',
      key: 'action',
      className: 'col-span-1',
      render: (_: any, record: any) => (
        <Popconfirm
          title="آیا مطمئن هستید؟"
          okText="بله"
          cancelText="خیر"
          onConfirm={() => onRemove(record)}
        >
          <Icon name="icon-delete" classname="text-red cursor-pointer" />
        </Popconfirm>
      ),
    },
  ];

  const onEdit = (record: any) => {
    setState(record);
  };
  const onRemove = (record: any) => {
    removeFund({
      data: record.fundId,
      onSuccess: () => getList(1, ''),
      onFail,
    });
  };

  const onSaveFund = ({ fundName, fundId }: any) => {
    const data = {
      ...(fundId && { fundId }),
      fundName,
    };
    saveFund({ data, onSuccess: onSuccessSave, onFail });
  };

  const getList = (pageNo: number, text: string) => {
    const data = {
      FundName: text,
      PageNumber: pageNo,
      PageSize: 10,
    };
    getFundList({
      data,
      onSuccess: onSuccessList,
      onFail,
    });
  };

  const onSuccessList = (list: any) => {
    setFundList(list);
  };

  const onSuccessSave = () => {
    childRef?.current?.onClear();
    getList(1, '');
  };

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSearch = (text: string) => {
    getList(1, text);
    setSearchText(text);
  };

  const onChangePage = (pageNo: number) => {
    getList(pageNo, searchText);
  };

  return (
    <>
      <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3">
        <span className="font-bold">ثبت صندوق بازارگردانی</span>
        <SimpleForm
          className="col-span-12 grid grid-cols-12 gap-2 mt-8 mb-6"
          list={formList}
          onSubmit={onSaveFund}
          values={state}
          reference={childRef}
        />
      </div>
      <div className="grid grid-cols-12 !mt-6">
        <SearchInput
          className=" col-span-5"
          onChange={onSearch}
          value={searchText}
        />
      </div>
      <Table
        columns={tableHeader}
        data={fundList?.items}
        className="col-span-12 grid grid-cols-12 "
        wrapperClassName="!mt-6"
        totalPages={fundList?.totalPages}
        pageSize={10}
        onChangePage={onChangePage}
      />
    </>
  );
}

const formList: ListType[] = [
  {
    name: 'fundName',
    label: 'نام صندوق',
    require: 'نام صندوق را وارد کنید',
    className: 'grid grid-cols-12 col-span-3',
  },
  {
    value: 'ثبت',
    type: 'submit',
    itemType: 'button',
    buttonClassName: 'bg-blue mt-1',
    className: 'text-white col-span-2 mr-4',
  },
];

export default withAlert(MarketingFund);
