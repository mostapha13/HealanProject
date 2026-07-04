import React, { useContext, useRef, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Popconfirm,
  Select,
  Table,
  InputNumber,
} from 'antd';
import type { FormInstance } from 'antd/es/form';
import { UpOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';

const EditableContext = React.createContext<FormInstance<any> | null>(null);

interface Item {
  key: string;
  firstCol: string;
  secondCol: string;
  thirdCol: string;
}

interface EditableRowProps {
  index: number;
}

const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

interface EditableCellProps {
  title: any;
  editable: boolean;
  children: React.ReactNode;
  dataIndex: any;
  record: Item;
  isSelect: boolean;
  selectData: any;
  inputMaxLength?: number;
  handleSave: (record: Item) => void;
  className?: string;
  type?: string | null;
}

const EditableCell = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  isSelect,
  handleSave,
  selectData,
  inputMaxLength,
  className,
  type,
  ...restProps
}: EditableCellProps) => {
  const [editing, setEditing] = useState(true);
  const inputRef = useRef<any>(null);
  const form = useContext(EditableContext)!;
  const [isOpenList, setIsOpenList] = useState(true);
  const toggleOpenSelectList = () => {
    setIsOpenList(!isOpenList);
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      handleSave({ ...record, ...values });
    } catch (errInfo) {}
  };
  let childNode: any = children;
  const InputTag = type === 'number' ? InputNumber : Input;
  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{ margin: 0 }}
        name={dataIndex}
        initialValue={childNode?.[1] || ''}
      >
        <InputTag
          placeholder={title !== undefined ? title : 'مقدار را وارد نمایید'}
          ref={inputRef}
          onPressEnter={save}
          onBlur={save}
          maxLength={inputMaxLength}
          showCount={
            inputMaxLength != undefined && inputMaxLength > 11 ? true : false
          }
          className={`${className} flex w-full`}
          value={childNode?.[1] || ''}
        />
      </Form.Item>
    ) : (
      <div
        className={`${className} editable-cell-value-wrap`}
        style={{ paddingRight: 24 }}
        // onClick={toggleEdit}
      >
        {children}
      </div>
    );
  }
  if (isSelect) {
    return (
      <Form.Item
        style={{
          margin: 2,
          alignItems: 'center',
          minHeight: '90px',
          justifyContent: 'center',
          paddingRight: '10px',
          paddingLeft: '10px',
          display: 'flex',
          height: '100%',
        }}
        name={dataIndex}
      >
        <Select
          suffixIcon={
            <UpOutlined
              className={isOpenList ? 'ant-select-suffix' : ''}
              onClick={toggleOpenSelectList}
            />
          }
          //onChange={handleChange}
          placeholder={title != undefined ? title : 'مقدار را وارد نمایید'}
          options={[
            { label: 'هیچکدام', value: 0 },
            ...selectData.map((item: any) => ({
              label: item.displayName,
              value: item.key,
            })),
          ]}
          onSelect={save}
          className="text-right"
          style={{ height: '100%' }}
        />
      </Form.Item>
    );
  }

  return (
    <td {...restProps} className={className}>
      {childNode}
    </td>
  );
};

type EditableTableProps = Parameters<typeof Table>[0];

interface DataType {
  key: React.Key;
  firstCol: string;
  secondCol: string;
  thirdCol: string;
  handleData?: any;
}

type ColumnTypes = Exclude<EditableTableProps['columns'], undefined>;

export const EditableTable = (props: any) => {
  const {
    onCompleteInputData,
    columnList,
    className,
    dataSource,
    isMulti = true,
  } = props;
  const [count, setCount] = useState(2);

  const handleDelete = (key?: React.Key) => {
    if (key === undefined) {
      return;
    }
    const newData = dataSource.filter((item: any) => item.key !== key);
    onCompleteInputData(newData);
  };

  const defaultColumns: (ColumnTypes[number] & {
    editable?: boolean;
    dataIndex: string;
    isSelect?: boolean;
    selectData?: any;
    inputMaxLength?: any;
    type?: string;
  })[] = [
    ...columnList,
    isMulti && {
      title: '',
      dataIndex: '',
      isSelect: true,
      render: (_: any, record: { key?: React.Key }, index: number) =>
        dataSource.length > 1 ? (
          <div style={{ flexDirection: 'row' }}>
            <Popconfirm
              title="آیا مطمئین هستید؟"
              onConfirm={() => handleDelete(record.key)}
              okText="بله"
              cancelText="خیر"
            >
              <Button
                icon={<MinusOutlined />}
                shape={'circle'}
                style={{ marginRight: 8 }}
              />
            </Popconfirm>
            {dataSource.length - 1 == index ? (
              <Button
                icon={<PlusOutlined />}
                shape={'circle'}
                style={{ marginRight: 8 }}
                onClick={handleAdd}
              />
            ) : null}
          </div>
        ) : (
          <Button
            icon={<PlusOutlined />}
            shape={'circle'}
            style={{ marginRight: 8 }}
            onClick={handleAdd}
          />
        ),
    },
  ].filter((item) => item !== false);

  const handleAdd = () => {
    const newData: any = {
      key: count,
    };
    onCompleteInputData([...dataSource, newData], true);
    setCount(count + 1);
  };

  const handleSave = (row: DataType, objectName: string) => {
    const newData = [...dataSource];
    const index = newData.findIndex((item) => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    onCompleteInputData(newData);
  };

  const components = {
    header: {
      cell: (cell: any) => (
        <th
          {...cell}
          className={`${cell.className} select-none !font-extra-bold !text-black !text-extratiny items-center flex justify-start`}
        >
          {cell.children[1]}
        </th>
      ),
    },
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  const columns = defaultColumns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: DataType) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        isSelect: col.isSelect,
        selectData: col.selectData,
        inputMaxLength: col.inputMaxLength,
        className: col.className,
        type: col.type,
        handleSave,
      }),
    };
  });

  return (
    <div>
      <Table
        components={components}
        rowClassName={() => `${className} editable-row`}
        bordered
        dataSource={dataSource}
        columns={columns as ColumnTypes}
        pagination={false}
        size="small"
      />
    </div>
  );
};
