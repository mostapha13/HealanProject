import { Button } from '@tse/components/atoms';
import { Modal, Table, Tag, Input as RInput } from 'antd';
import { useStates, useEffect } from '@tse/utils';

const columns = [
  {
    title: 'کد بورسی',
    dataIndex: 'investorCode',
    className: 'col-span-5',
  },
  {
    title: 'نام سرمایه گزار',
    dataIndex: 'investorName',
    className: 'col-span-6 overflow-hidden !text-right',
  },
];

const initialState = {
  isModalVisible: false,
  selectedItems: null,
  selectedRowKeys: null,
  tagList: [],
  searchText: '',
};

export function InvestorModal({
  data,
  onSubmit,
  defaultValue,
  className,
  onChange,
  error,
}: any) {
  const [state, setState] = useStates<any>(initialState);
  const {
    isModalVisible,
    selectedItems,
    selectedRowKeys,
    tagList,
    searchText,
  } = state;

  useEffect(() => {
    const selectedKeys: any = [];
    defaultValue?.map((item: any) => selectedKeys.push(item.investorId));
    setState({
      selectedRowKeys: selectedKeys,
      selectedItems: defaultValue,
      tagList: defaultValue,
    });
  }, [defaultValue]);

  const showModal = () => {
    setState({
      isModalVisible: true,
    });
  };

  const handleOk = () => {
    onSubmit(selectedItems);
    setState({
      isModalVisible: false,
      tagList: selectedItems,
    });
  };

  const handleCancel = () => {
    setState({
      isModalVisible: false,
    });
  };

  const onSelect = (selectedRowKeys: any, selectedRows: any) => {
    setState({
      selectedItems: selectedRows,
      selectedRowKeys: selectedRowKeys,
    });
  };
  const rowSelection = {
    selectedItems,
    selectedRowKeys,
    onChange: onSelect,
  };

  const onSearch = (e: any) => {
    onChange(e?.target.value, 1);
    setState({
      searchText: e?.target.value,
    });
  };

  const onRemoveItem = (id: string) => {
    const newList = selectedItems.filter(
      ({ investorId }: any) => investorId !== id
    );
    setState({
      selectedItems: newList,
    });
    onSubmit(newList);
  };

  const borderColor = error ? 'border-red' : 'border-blue';

  return (
    <div className={className}>
      <Button
        className={`${borderColor} border text-blue w-[130px]`}
        onClick={showModal}
      >
        انتخاب سرمایه گذار
      </Button>
      <Modal
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        cancelText="لغو"
        style={{ textAlign: 'center', padding: '0px' }}
        okText="تایید"
        title="انتخاب سرمایه گذار"
        okButtonProps={{
          style: {
            marginRight: '20px',
          },
        }}
      >
        <div className="mb-2 mt-[-12px]">
          <RInput placeholder="جست و جو سرمایه گذار" onChange={onSearch} />
        </div>
        <div className="mb-[-20px]">
          <Table
            rowSelection={rowSelection}
            className="!mt-6"
            rowClassName="col-span-12 grid grid-cols-12"
            columns={columns}
            dataSource={data?.items}
            size="small"
            rowKey="investorId"
            pagination={{
              onChange: (pageNo) => onChange(searchText, pageNo),
              pageSize: 10,
              total: data?.totalPages,
              position: ['bottomCenter'],
              showSizeChanger: false,
            }}
          />
        </div>
      </Modal>
      <div className="mt-3">
        {tagList?.map(({ investorName, investorId }: any) => {
          return (
            <Tag closable onClose={() => onRemoveItem(investorId)}>
              {investorName}
            </Tag>
          );
        })}
      </div>
    </div>
  );
}
