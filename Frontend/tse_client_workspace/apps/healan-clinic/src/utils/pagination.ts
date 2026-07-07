import type { PaginatedResponse } from '../api/types';

/** حداکثر pageSize مجاز در API (Share.Application PaginatedList) */
export const HEALAN_MAX_PAGE_SIZE = 20;

export function clampPageSize(pageSize?: number): number {
  if (!pageSize || pageSize < 1) return HEALAN_MAX_PAGE_SIZE;
  return Math.min(pageSize, HEALAN_MAX_PAGE_SIZE);
}

export async function fetchAllPaginated<T>(
  fetchPage: (pageNumber: number, pageSize: number) => Promise<PaginatedResponse<T>>,
  pageSize = HEALAN_MAX_PAGE_SIZE,
  maxPages = 100
): Promise<T[]> {
  const items: T[] = [];
  let pageNumber = 1;
  let hasNextPage = true;

  while (hasNextPage && pageNumber <= maxPages) {
    const res = await fetchPage(pageNumber, pageSize);
    items.push(...(res.items ?? []));
    hasNextPage = Boolean(res.hasNextPage);
    pageNumber += 1;
  }

  return items;
}
