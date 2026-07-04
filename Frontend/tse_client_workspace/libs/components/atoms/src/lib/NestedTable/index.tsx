import { Table, ConfigProvider, Input } from 'antd';
import { useState, useEffect } from '@tse/utils';
import type {
  FilterValue,
  SorterResult,
  TablePaginationConfig,
} from '@tse/types';
import { SearchOutlined } from '@ant-design/icons';
import './style.scss';

export const NestedTable = ({
  data,
  columns,
  childColumns,
  className,
  wrapperClassName,
  onChangePage,
  pageSize = 10,
  totalPages = 1,
  isPagination = true,
  onChange,
  pageNumber,
  rowSelection,
  childKey,
  childClassName,
  ...props
}: any) => {
  const columnsData = rowSelection
    ? [
        ...columns,
        Table.SELECTION_COLUMN,
        {
          title: 'وضعیت',
          dataIndex: 'check',
          key: 'check',
          fixed: 'right',
          width: 60,
        },
      ]
    : columns;

  const [tempPageNumber, setTempPageNumber] = useState(1);
  const handlePageChange = (num: number) => {
    setTempPageNumber(num);
    onChangePage?.(num);
  };

  const handleOnChange = (
    newPagination: TablePaginationConfig,
    filters: Record<string, FilterValue>,
    sorter: SorterResult<any>,
    extra: any
  ) => {
    onChange?.({ newPagination, filters, sorter, extra });
  };

  useEffect(() => {
    if (pageNumber) {
      setTempPageNumber(pageNumber);
    }
  }, [pageNumber]);

  useEffect(() => {
    if (data?.length === 0 && totalPages * pageSize >= pageSize) {
      setTempPageNumber((number: number) => number - 1);
      onChangePage?.(tempPageNumber - 1);
    }
  }, [totalPages]);

  const expandedRowRender = (e: any) => {
    return (
      <Table
        columns={childColumns}
        locale={locale}
        dataSource={e[childKey]}
        pagination={false}
        className={`${childClassName} child-container`}
        rowClassName={`${className}`}
        onChange={handleOnChange as any}
        components={{
          header: {
            row: (cell: any) => (
              <tr
                {...cell}
                className={`${cell.className} select-none !font-extra-bold !text-black !text-extratiny !contents  fix-cell-table whitespace-pre`}
              />
            ),
          },
        }}
      />
    );
  };

  return (
    <ConfigProvider direction="rtl">
      <Table
        columns={columnsData}
        expandable={{
          expandedRowRender,
        }}
        locale={locale}
        dataSource={data}
        size="small"
        className={wrapperClassName}
        rowSelection={rowSelection}
        {...props}
        rowClassName={`${className}`}
        components={{
          header: {
            row: (cell: any) => (
              <tr
                {...cell}
                className={`${cell.className} select-none !font-extra-bold !text-black !text-extratiny !contents  fix-cell-table whitespace-pre`}
              />
            ),
          },
        }}
        pagination={
          isPagination
            ? {
                onChange: handlePageChange,
                pageSize: pageSize,
                total: totalPages * pageSize,
                position: ['bottomRight'],
                showSizeChanger: false,
                hideOnSinglePage: true,
                ...(pageNumber && {
                  current: pageNumber,
                }),
              }
            : false
        }
      />
    </ConfigProvider>
  );
};

export const getColumnSearchProps = (dataIndex: any, onChangeText: any) => ({
  filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }: any) => (
    <div
      style={{
        padding: 8,
      }}
    >
      <Input
        placeholder={`جست و جو`}
        value={selectedKeys[0]}
        onChange={(e) => onChangeText(e.target.value)}
        style={{
          marginBottom: 2,
          display: 'block',
        }}
      />
    </div>
  ),
  filterIcon: (filtered: boolean) => (
    <SearchOutlined
      style={{
        color: filtered ? '#1890ff' : undefined,
        marginLeft: '10px',
      }}
    />
  ),
});

const locale = {
  emptyText: (
    <div className="flex flex-1 items-center justify-center">
      <span className="text-base">اطلاعاتی برای نمایش وجود ندارد!</span>
    </div>
  ),
};
