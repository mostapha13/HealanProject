import React, { useEffect, useState } from 'react';
import { Table as AntTable, ConfigProvider } from 'antd';
import type {
  TablePaginationConfig,
  SorterResult,
  FilterValue,
} from 'antd/es/table/interface';
import './styles.scss';

interface TableTypes {
  data?: any[];
  columns?: any[];
  onChangePage?: (page: number) => void;
  pageSize?: number;
  totalPages?: number;
  className?: string;
  wrapperClassName?: string;
  isPagination?: boolean;
  rowSelection?: any;
  rowKey?: string;
  pageNumber?: number;
  isLoading?: boolean;
  disableRow?: boolean;
  onChange?: (args: any) => void;
}

export const SmartTable = ({
  data = [],
  columns = [],
  onChangePage,
  pageSize = 10,
  totalPages = 1,
  className,
  wrapperClassName,
  isPagination = true,
  rowSelection,
  rowKey,
  pageNumber,
  isLoading,
  disableRow,
  onChange,
}: TableTypes) => {
  const [tempPageNumber, setTempPageNumber] = useState(1);

  const columnsData = [
    // {
    //   title: 'ردیف',
    //   dataIndex: 'index',
    //   key: 'index',
    //   render: (_: any, __: any, i: number) => <span>{i + 1}</span>,
    // },
    ...columns,
  ];

  const colWidth = `${100 / columnsData.length}%`;
  const adjustedColumns = columnsData.map((col) => ({
    ...col,
    width: col.width || colWidth,
  }));

  const handlePageChange = (num: number) => {
    setTempPageNumber(num);
    onChangePage?.(num);
  };

  const handleOnChange = (
    newPagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<any> | SorterResult<any>[],
    extra: any
  ) => {
    onChange?.({ newPagination, filters, sorter, extra });
  };

  useEffect(() => {
    if (pageNumber) {
      setTempPageNumber(pageNumber);
    }
  }, [pageNumber]);

  return (
    <ConfigProvider direction="rtl">
      <AntTable
        locale={locale}
        components={{
          header: {
            cell: (cell: any) => (
              <th
                {...cell}
                className={`${cell.className} select-none !font-extra-bold !text-black !text-extratiny items-center  justify-start  `}
              >
                {cell.children}
              </th>
            ),
          },
          body: {
            cell: (cell: any) => (
              <td
                {...cell}
                className={`${cell.className} items-center  !font-medium !text-black !text-extratiny p-2 whitespace-pre overflow-hidden text-ellipsis `}
              >
                {cell.children}
              </td>
            ),
          },
        }}
        rowSelection={rowSelection}
        rowKey={rowKey}
        columns={adjustedColumns}
        tableLayout="auto"
        scroll={{ x: 'max-content' }}
        dataSource={data}
        bordered
        size="small"
        loading={isLoading}
        className={`${wrapperClassName} custom-rtl-table`}
        rowClassName={className}
        onChange={handleOnChange}
        pagination={
          isPagination
            ? {
                onChange: handlePageChange,
                pageSize,
                total: totalPages * pageSize,
                position: ['bottomLeft'],
                showSizeChanger: false,
                hideOnSinglePage: true,
                ...(pageNumber && { current: pageNumber }),
              }
            : false
        }
      />
    </ConfigProvider>
  );
};

const locale = {
  emptyText: (
    <div className="flex flex-1 items-center justify-center">
      <span className="text-base">اطلاعاتی برای نمایش وجود ندارد!</span>
    </div>
  ),
};
