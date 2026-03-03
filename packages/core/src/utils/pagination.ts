import type { PaginationParams, PaginatedResult } from '../types/index.js';

export function paginate<T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginatedResult<T> {
  return {
    data,
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit),
  };
}

export function getOffset(params: PaginationParams): number {
  return (params.page - 1) * params.limit;
}
