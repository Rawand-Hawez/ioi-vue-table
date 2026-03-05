import type { IoiPaginationChangePayload } from '../../types';
import { clamp } from './utils';

export function buildPaginationPayload(
  pageIndex: number,
  pageSize: number,
  rowCount: number,
  reason: IoiPaginationChangePayload['reason']
): IoiPaginationChangePayload {
  const pageCount = pageSize > 0 ? Math.max(1, Math.ceil(rowCount / pageSize)) : 1;
  const clampedPageIndex = pageSize > 0 ? clamp(pageIndex, 0, pageCount - 1) : 0;

  return {
    pageIndex: clampedPageIndex,
    pageSize,
    pageCount,
    rowCount,
    reason
  };
}
