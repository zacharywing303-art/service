import { describe, it, expect } from 'vitest';
import { generateDocumentNumber, incrementNumber } from './invoice-number.js';

describe('generateDocumentNumber', () => {
  it('concatenates prefix and number', () => {
    expect(generateDocumentNumber('INV-', '1001')).toBe('INV-1001');
  });

  it('works with estimate prefix', () => {
    expect(generateDocumentNumber('EST-', '2050')).toBe('EST-2050');
  });

  it('handles empty prefix', () => {
    expect(generateDocumentNumber('', '1001')).toBe('1001');
  });

  it('handles custom prefix format', () => {
    expect(generateDocumentNumber('ACME-INV-', '500')).toBe('ACME-INV-500');
  });
});

describe('incrementNumber', () => {
  it('increments a string number by 1', () => {
    expect(incrementNumber('1001')).toBe('1002');
  });

  it('increments from 999 to 1000', () => {
    expect(incrementNumber('999')).toBe('1000');
  });

  it('increments from 1 to 2', () => {
    expect(incrementNumber('1')).toBe('2');
  });

  it('increments large numbers', () => {
    expect(incrementNumber('99999')).toBe('100000');
  });

  it('returns a string', () => {
    const result = incrementNumber('1001');
    expect(typeof result).toBe('string');
  });
});
