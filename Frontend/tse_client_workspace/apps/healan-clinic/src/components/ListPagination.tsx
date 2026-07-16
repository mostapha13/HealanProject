import React, { useCallback, useState } from 'react';
import { Pagination } from 'antd';

export const HEALAN_LIST_PAGE_SIZE = 10;
export const HEALAN_LIST_PAGE_SIZE_OPTIONS = [10, 15, 20] as const;

export function useListPagination(initialPageSize = HEALAN_LIST_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const onPaginationChange = useCallback((nextPage: number, nextSize: number) => {
    if (nextSize !== pageSize) {
      setPageSize(nextSize);
      setPage(1);
      return;
    }
    setPage(nextPage);
  }, [pageSize]);

  return { page, pageSize, setPage, onPaginationChange };
}

interface ListPaginationProps {
  page: number;
  totalCount: number;
  pageSize: number;
  onChange: (page: number, pageSize: number) => void;
}

/** Shared Ant Design pagination for clinic list pages (server-side). */
export function ListPagination({
  page,
  totalCount,
  pageSize,
  onChange,
}: ListPaginationProps) {
  // حتی با یک صفحه هم انتخاب سایز 10/15/20 را نشان بده
  if (totalCount < 0) return null;
  if (totalCount === 0) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', paddingBottom: '0.5rem' }}>
      <Pagination
        current={page}
        total={totalCount}
        pageSize={pageSize}
        pageSizeOptions={[...HEALAN_LIST_PAGE_SIZE_OPTIONS].map(String)}
        showSizeChanger
        showQuickJumper={totalCount > pageSize}
        hideOnSinglePage={false}
        onChange={(nextPage, nextSize) => onChange(nextPage, nextSize ?? pageSize)}
        showTotal={(total) => {
          const totalPages = Math.max(1, Math.ceil(total / pageSize));
          return `صفحه ${page} از ${totalPages} · ${total} مورد`;
        }}
      />
    </div>
  );
}
