import { TextField } from '@tse/components/atoms';
import { Modal, Table, Input as RInput } from 'antd';
import { useStates, useEffect } from '@tse/utils';

const columns = [
  {
    title: 'نماد',
    dataIndex: 'symbol',
    className: 'col-span-5',
  },
  {
    title: 'نام نماد',
    dataIndex: 'symbolName',
    className: 'col-span-6',
  },
];

const initialState = {
  isModalVisible: false,
  selectedItems: null,
};

export function NewSymbolModal({
  data,
  onSubmit,
  defaultValue,
  className,
  onChange,
  required,
  error,
}: any) {
  const [state, setState] = useStates<any>(initialState);
  const { isModalVisible, selectedItems } = state;

  useEffect(() => {
    setState({
      selectedItems: defaultValue,
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
    });
  };

  const handleCancel = () => {
    setState({
      isModalVisible: false,
    });
  };

  const onSelect = (_: any, selectedRows: any) => {
    setState({
      selectedItems: selectedRows[0],
    });
  };
  const rowSelection: any = {
    type: 'radio',
    selectedItems,
    onChange: onSelect,
    hideSelectAll: true,
  };

  const onSearch = (e: any) => {
    onChange(1, e?.target.value);
  };

  return (
    <div className={className}>
      <TextField
        label="انتخاب نماد"
        onClick={showModal}
        className="w-full"
        value={defaultValue ? defaultValue.symbolName : ''}
        required={required}
        error={error}
      />
      <Modal
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        cancelText="لغو"
        style={{ textAlign: 'center', padding: '0px' }}
        okText="تایید"
        title="انتخاب نماد"
        okButtonProps={{
          style: {
            marginRight: '20px',
            backgroundColor: '#D39E46',
            borderColor: 'white',
          },
        }}
      >
        <div className="mb-2 mt-[-12px]">
          <RInput placeholder="جست و جو نماد" onChange={onSearch} />
        </div>
        <div className="mb-[-20px]">
          <Table
            rowSelection={rowSelection}
            className="!mt-6"
            rowClassName="col-span-12 grid grid-cols-12 "
            columns={columns}
            dataSource={data?.lst}
            size="small"
            rowKey="instrumentId"
            pagination={{
              onChange: (pageNo) => onChange(pageNo),
              pageSize: 10,
              total: data?.totalPages,
              position: ['bottomCenter'],
              showSizeChanger: false,
            }}
          />
        </div>
      </Modal>
    </div>
  );
}
