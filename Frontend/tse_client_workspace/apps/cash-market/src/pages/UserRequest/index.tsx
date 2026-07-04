import { SearchInput } from '@tse/components/molecules';
import { Table } from '@tse/components/organism';
import { HeaderTypes } from '@tse/types';

const tableHeader: HeaderTypes[] = [
  {
    title: ' نام صندوق',
    dataIndex: 'firstName',
    key: 'firstName',
    className: 'col-span-2',
  },
  {
    title: 'نام مدیر صندوق',
    dataIndex: 'lastName',
    key: 'lastName',
    className: 'col-span-3',
  },
  {
    title: 'تاریخ',
    dataIndex: 'marketMakerUserGroup',
    key: 'marketMakerUserGroup',
    className: 'col-span-2',
    render: (item: any) => <span>{item?.groupName}</span>,
  },
  {
    title: 'شماره پیگیری',
    dataIndex: 'fund',
    key: 'fund',
    className: 'col-span-2',
    render: (item: any) => <span>{item?.fundName}</span>,
  },
  {
    title: 'مشاهده درخواست',
    dataIndex: 'phoneNumber',
    key: 'phoneNumber',
    className: 'col-span-2',
  },
];

function UserRequest() {
  const onChangePage = () => {};
  const onSearch = () => {};
  return (
    <div className="grid shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3">
      <span className="font-bold">درخواست های ثبت نام</span>
      <div className="grid grid-cols-12 !mt-6">
        <SearchInput className=" col-span-5" onChange={onSearch} />
      </div>
      <Table
        columns={tableHeader}
        data={[]}
        className="col-span-12 grid grid-cols-12 "
        wrapperClassName="!mt-6"
        totalPages={1}
        pageSize={10}
        onChangePage={onChangePage}
      />
    </div>
  );
}

export default UserRequest;
