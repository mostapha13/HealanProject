/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { Icon } from '@tse/components/atoms';
import { Table } from '@tse/components/organism';
import { SearchInput, SimpleForm } from '@tse/components/molecules';
import { Popconfirm } from 'antd';
import {
  saveQuitReason,
  getQuitReasonList,
  removeQuitReason,
} from '../../../Controller';
import withAlert from '../../../hoc/withAlert';
import { useEffect, useState, useRef } from '@tse/utils';
import { HeaderTypes, ListType } from '@tse/types';

function QuitReason({ onAlert }: any) {
  const childRef: any = useRef();
  const [reasonList, setReasonList] = useState<any>([]);
  const [state, setState] = useState({});
  const [searchText, setSearchText] = useState('');
  const tableHeader: HeaderTypes[] = [
    {
      title: 'علت انصراف',
      dataIndex: 'quitReasonName',
      key: '',
      className: 'col-span-9',
    },
    {
      title: 'ویرایش',
      key: 'edit',
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
      key: 'delete',
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

  useEffect(() => {
    getList(1, '');
  }, []);

  const getList = (pageNo: number, text: string) => {
    const data = {
      QuitReasonName: text,
      PageNumber: pageNo,
      PageSize: 10,
    };
    getQuitReasonList({ data, onSuccess: onSuccessList, onFail });
  };

  const onSuccessList = (list: any) => {
    setReasonList(list);
  };

  const onRemove = (record: any) => {
    removeQuitReason({
      data: record.quitReasonId,
      onSuccess: () => getList(1, ''),
      onFail,
    });
  };

  const onEdit = (record: any) => {
    setState(record);
  };

  const submit = ({ quitReasonName, quitReasonId }: any) => {
    const data = {
      ...(quitReasonId && { quitReasonId }),
      quitReasonName,
    };
    saveQuitReason({ data, onSuccess: onSuccessSave, onFail });
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
        <span className="font-bold">ثبت علت انصراف</span>
        <SimpleForm
          className="col-span-12 grid grid-cols-12 gap-2 mt-8 mb-6"
          list={formList}
          onSubmit={submit}
          values={state}
          reference={childRef}
        />
      </div>
      <div className="grid grid-cols-12 !mt-6">
        <SearchInput
          className="col-span-5"
          onChange={onSearch}
          value={searchText}
        />
      </div>
      <Table
        columns={tableHeader}
        data={reasonList?.items}
        className="col-span-12 grid grid-cols-12"
        wrapperClassName="!mt-6"
        totalPages={reasonList?.totalPages}
        pageSize={10}
        onChangePage={onChangePage}
      />
    </>
  );
}

const formList: ListType[] = [
  {
    name: 'quitReasonName',
    label: 'علت انصراف',
    require: 'علت انصراف را وارد کنید',
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

export default withAlert(QuitReason);
