/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import type {
  TableTypes,
  FilterValue,
  SorterResult,
  TablePaginationConfig,
} from '@tse/types';

import { Input } from '@tse/components/atoms';
import { Table as RTable } from 'antd';
import { useEffect, useState } from '@tse/utils';
import './styles.scss';

export const Table = ({
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
  scrollX,
  ...props
}: TableTypes) => {
  const [tempPageNumber, setTempPageNumber] = useState(1);

  const p = (pageNumber && (pageNumber - 1) * pageSize) || 0;

  const columnsData = [
    {
      title: 'ردیف',
      dataIndex: 'index',
      key: 'index',
      className: '',
      render: (l: any, r: any, i: number) => <span>{i + 1}</span>,
    },
    ...columns,
  ];

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
    if (data.length === 0 && totalPages * pageSize >= pageSize) {
      setTempPageNumber((number: number) => number - 1);
      onChangePage?.(tempPageNumber - 1);
    }
  }, [totalPages]);

  const justifyStyle = data.length === 0 && 'justify-center';

  return (
    <RTable
      locale={locale}
      rowSelection={rowSelection}
      rowKey={rowKey}
      columns={!disableRow ? columnsData : [...columns]}
      showSorterTooltip={false}
      components={{
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
          cell: (cell: any) => (
            <th
              className={`${cell.className} items-center flex ${justifyStyle} !font-medium !text-black !text-extratiny p-2 whitespace-pre overflow-hidden text-ellipsis`}
            >
              {cell.children[1]}
            </th>
          ),
        },
      }}
      scroll={{
        x: scrollX ? scrollX : 900,
      }}
      dataSource={data && data}
      bordered
      size="small"
      loading={isLoading}
      className={`custom-grid-table ${wrapperClassName || ''}`}
      rowClassName={className}
      onChange={handleOnChange as any}
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
      {...props}
    />
  );
};

const locale = {
  emptyText: (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <span className="text-base">اطلاعاتی برای نمایش وجود ندارد!</span>
    </div>
  ),
};
