export const PAGE_SIZE_OPTIONS = [10, 15, 20] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 10;
export const MAX_PAGE_SIZE: PageSize = 20;

export interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: PageSize;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
}

export function clampPageSize(value: number): PageSize {
  if (value <= 10) return 10;
  if (value <= 15) return 15;
  return 20;
}

export function paginate<T>(
  items: T[],
  page: number,
  pageSize: PageSize,
): PageResult<T> {
  const size = clampPageSize(pageSize);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / size));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * size;
  const end = Math.min(start + size, totalItems);

  return {
    items: items.slice(start, end),
    page: currentPage,
    pageSize: size,
    totalItems,
    totalPages,
    startIndex: totalItems === 0 ? 0 : start + 1,
    endIndex: end,
  };
}

/** Compact page number list with ellipsis markers (-1). */
export function getPageNumbers(
  current: number,
  total: number,
): Array<number | "ellipsis"> {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total, current]);
  if (current - 1 > 1) pages.add(current - 1);
  if (current + 1 < total) pages.add(current + 1);

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];

  for (let i = 0; i < sorted.length; i += 1) {
    const page = sorted[i];
    const prev = sorted[i - 1];
    if (i > 0 && prev !== undefined && page - prev > 1) {
      result.push("ellipsis");
    }
    result.push(page);
  }

  return result;
}
