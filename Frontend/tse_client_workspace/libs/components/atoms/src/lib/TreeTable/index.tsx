import { Table, ConfigProvider } from 'antd';
import type {
  TableTypes,
  FilterValue,
  SorterResult,
  TablePaginationConfig,
} from '@tse/types';
import { useState, useEffect } from '@tse/utils';

export const TreeTable = ({
  data,
  columns,
  className,
  wrapperClassName,
  onChangePage,
  pageSize = 10,
  totalPages = 1,
  isPagination = true,
  onChange,
  pageNumber,
  ...props
}: TableTypes) => {
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
  return (
    <ConfigProvider direction="rtl">
      <Table
        locale={locale}
        size="small"
        columns={columns}
        dataSource={data}
        className={wrapperClassName}
        {...props}
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

const locale = {
  emptyText: (
    <div className="flex flex-1 items-center justify-center">
      <span className="text-base">اطلاعاتی برای نمایش وجود ندارد!</span>
    </div>
  ),
};
