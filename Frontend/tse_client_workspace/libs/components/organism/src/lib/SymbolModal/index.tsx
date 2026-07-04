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
  selectedRowKeys: null,
  value: '',
};

export function SymbolModal({
  data,
  onSubmit,
  defaultValue,
  className,
  onChange,
  required,
  error,
  disabled,
  showKey,
  type = 'radio',
  label = 'انتخاب نماد',
}: any) {
  const [state, setState] = useStates<any>(initialState);
  const { isModalVisible, selectedItems, selectedRowKeys, value } = state;

  useEffect(() => {
    const isArray = Array.isArray(defaultValue);
    const keys = [];
    isArray
      ? defaultValue?.map((item: any) => keys.push(item.instrumentId))
      : keys.push(defaultValue?.instrumentId);
    setState({
      selectedItems: defaultValue,
      value: isArray
        ? defaultValue.map((u) => u.symbol).join(', ')
        : showKey
        ? `${defaultValue?.[showKey]}`
        : defaultValue?.symbol,

      selectedRowKeys: keys,
    });
  }, [defaultValue]);

  const showModal = () => {
    setState({
      isModalVisible: true,
    });
  };

  const handleOk = () => {
    onSubmit(selectedItems, selectedRowKeys);
    setState({
      isModalVisible: false,
    });
  };

  const handleCancel = () => {
    setState({
      isModalVisible: false,
    });
  };

  const onSelect = (selectedRowKeys: any, selectedRows: any) => {
    setState({
      selectedItems: type === 'radio' ? selectedRows[0] : selectedRows,
      selectedRowKeys,
    });
  };
  const rowSelection: any = {
    type: type,
    selectedItems,
    onChange: onSelect,
    hideSelectAll: type === 'radio' ? true : false,
    selectedRowKeys,
  };

  const onSearch = (e: any) => {
    setState({
      value: e?.target.value,
      selectedItems: {
        instrumentId: '',
        symbolCode: '',
        symbol: '',
        symbolName: '',
        marketTypeId: '',
        investment: 0,
        companyName: '',
      },
      selectedRowKeys: null,
    });
    onChange(1, e?.target.value);
  };

  return (
    <div className={className}>
      <TextField
        label={label}
        {...(!disabled && { onClick: showModal })}
        className="w-full"
        value={value || ''}
        required={required}
        error={error}
        disabled={disabled}
      />
      <Modal
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        cancelText="لغو"
        style={{ textAlign: 'center', padding: '0px' }}
        okText="تایید"
        title={label}
        okButtonProps={{
          style: {
            marginRight: '20px',
          },
        }}
      >
        <div className="mb-2 mt-[-12px]">
          <RInput
            value={value}
            placeholder="جست و جو نماد"
            onChange={onSearch}
          />
        </div>
        <div className="mb-[-20px]">
          <Table
            rowSelection={rowSelection}
            className="!mt-6 custom-grid-table"
            // rowClassName="col-span-12 grid grid-cols-12 "
            columns={columns}
            dataSource={data?.items}
            size="small"
            rowKey="instrumentId"
            pagination={{
              onChange: (pageNo) => onChange(pageNo, value),
              pageSize: 10,
              total: data?.totalCount,
              position: ['bottomCenter'],
              showSizeChanger: false,
            }}
          />
        </div>
      </Modal>
    </div>
  );
}
