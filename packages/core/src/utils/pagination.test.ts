import { describe, it, expect } from 'vitest';
import { paginate, getOffset } from './pagination.js';

describe('getOffset', () => {
  it('returns 0 for page 1', () => {
    expect(getOffset({ page: 1, limit: 20, sortOrder: 'desc' })).toBe(0);
  });

  it('returns correct offset for page 2 with limit 20', () => {
    expect(getOffset({ page: 2, limit: 20, sortOrder: 'desc' })).toBe(20);
  });

  it('returns correct offset for page 3 with limit 10', () => {
    expect(getOffset({ page: 3, limit: 10, sortOrder: 'desc' })).toBe(20);
  });

  it('returns correct offset for page 5 with limit 5', () => {
    expect(getOffset({ page: 5, limit: 5, sortOrder: 'desc' })).toBe(20);
  });
});

describe('paginate', () => {
  it('returns correct paginated result', () => {
    const data = [{ id: 1 }, { id: 2 }];
    const result = paginate(data, 50, { page: 1, limit: 20, sortOrder: 'desc' });

    expect(result).toEqual({
      data,
      total: 50,
      page: 1,
      limit: 20,
      totalPages: 3,
    });
  });

  it('calculates totalPages correctly when total is evenly divisible', () => {
    const result = paginate([], 40, { page: 1, limit: 20, sortOrder: 'desc' });
    expect(result.totalPages).toBe(2);
  });

  it('rounds up totalPages when not evenly divisible', () => {
    const result = paginate([], 41, { page: 1, limit: 20, sortOrder: 'desc' });
    expect(result.totalPages).toBe(3);
  });

  it('returns 0 totalPages when total is 0', () => {
    const result = paginate([], 0, { page: 1, limit: 20, sortOrder: 'desc' });
    expect(result.totalPages).toBe(0);
  });

  it('returns 1 totalPage when total equals limit', () => {
    const result = paginate([], 20, { page: 1, limit: 20, sortOrder: 'desc' });
    expect(result.totalPages).toBe(1);
  });

  it('preserves the data array as-is', () => {
    const data = [{ a: 1 }, { b: 2 }, { c: 3 }];
    const result = paginate(data, 100, { page: 5, limit: 10, sortOrder: 'desc' });
    expect(result.data).toBe(data);
    expect(result.page).toBe(5);
    expect(result.limit).toBe(10);
  });
});
