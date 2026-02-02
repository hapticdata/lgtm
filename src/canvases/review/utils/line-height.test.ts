import { test, expect } from 'bun:test';
import { calculateVisualRows, getVisibleLineRange } from './line-height';

test('calculateVisualRows - short line fits in one row', () => {
  expect(calculateVisualRows('hello', 8, 80)).toBe(1);
});

test('calculateVisualRows - long line wraps to two rows', () => {
  const longLine = 'a'.repeat(100);
  expect(calculateVisualRows(longLine, 8, 80)).toBe(2);
});

test('calculateVisualRows - exact fit is one row', () => {
  const line = 'a'.repeat(70);
  expect(calculateVisualRows(line, 8, 80)).toBe(1);
});

test('calculateVisualRows - one char over wraps', () => {
  const line = 'a'.repeat(72);
  expect(calculateVisualRows(line, 8, 80)).toBe(2);
});

test('calculateVisualRows - empty line is still one row', () => {
  expect(calculateVisualRows('', 8, 80)).toBe(1);
});

test('getVisibleLineRange - all lines fit', () => {
  const lines = [
    { content: 'short' },
    { content: 'also short' },
    { content: 'another' },
  ];
  const result = getVisibleLineRange(lines, 0, 10, 8, 80);
  expect(result.endIndex).toBe(3);
  expect(result.totalVisualRows).toBe(3);
});

test('getVisibleLineRange - stops when visual rows exhausted', () => {
  const lines = [
    { content: 'a'.repeat(100) },
    { content: 'short' },
    { content: 'a'.repeat(100) },
    { content: 'short' },
  ];
  const result = getVisibleLineRange(lines, 0, 4, 8, 80);
  expect(result.endIndex).toBe(2);
  expect(result.totalVisualRows).toBe(3);
});

test('getVisibleLineRange - respects start offset', () => {
  const lines = [
    { content: 'first' },
    { content: 'second' },
    { content: 'third' },
    { content: 'fourth' },
  ];
  const result = getVisibleLineRange(lines, 2, 2, 8, 80);
  expect(result.endIndex).toBe(4);
  expect(result.totalVisualRows).toBe(2);
});

test('getVisibleLineRange - single long line that wraps multiple times', () => {
  const lines = [
    { content: 'a'.repeat(200) },
    { content: 'short' },
  ];
  const result = getVisibleLineRange(lines, 0, 3, 8, 80);
  expect(result.endIndex).toBe(1);
  expect(result.totalVisualRows).toBe(3);
});

test('getVisibleLineRange - empty lines array', () => {
  const result = getVisibleLineRange([], 0, 10, 8, 80);
  expect(result.endIndex).toBe(0);
  expect(result.totalVisualRows).toBe(0);
});
