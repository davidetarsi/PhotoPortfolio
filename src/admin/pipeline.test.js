// src/admin/pipeline.test.js
import { describe, it, expect, vi } from 'vitest';
import { targetDimensions, shouldUploadAsIs, processFile, MAX_DIMENSION, WEBP_QUALITY } from './pipeline.js';

describe('targetDimensions', () => {
  it('riduce il lato lungo a 1900 mantenendo l\'aspect ratio', () => {
    expect(targetDimensions(3800, 1900)).toEqual({ width: 1900, height: 950 });
    expect(targetDimensions(1900, 3800)).toEqual({ width: 950, height: 1900 });
  });
  it('non ingrandisce mai', () => {
    expect(targetDimensions(800, 600)).toEqual({ width: 800, height: 600 });
  });
  it('arrotonda a interi', () => {
    const { width, height } = targetDimensions(3001, 2000);
    expect(Number.isInteger(width)).toBe(true);
    expect(Number.isInteger(height)).toBe(true);
    expect(width).toBe(1900);
  });
});

describe('shouldUploadAsIs', () => {
  it('true solo per webp già entro i limiti', () => {
    expect(shouldUploadAsIs('image/webp', 1900, 1000)).toBe(true);
    expect(shouldUploadAsIs('image/webp', 1901, 1000)).toBe(false);
    expect(shouldUploadAsIs('image/jpeg', 800, 600)).toBe(false);
  });
});

describe('processFile', () => {
  it('webp piccolo → as-is: nessun encode, blob = file originale', async () => {
    const decode = vi.fn(async () => ({ bitmap: 'BMP', width: 1000, height: 800 }));
    const encode = vi.fn();
    const file = { type: 'image/webp' };
    const res = await processFile(file, { decode, encode });
    expect(res).toEqual({ blob: file, width: 1000, height: 800 });
    expect(encode).not.toHaveBeenCalled();
  });
  it('jpeg grande → resize + encode con qualità 0.85', async () => {
    const decode = vi.fn(async () => ({ bitmap: 'BMP', width: 3800, height: 1900 }));
    const encode = vi.fn(async () => 'WEBP_BLOB');
    const res = await processFile({ type: 'image/jpeg' }, { decode, encode });
    expect(encode).toHaveBeenCalledWith('BMP', 1900, 950, WEBP_QUALITY);
    expect(res).toEqual({ blob: 'WEBP_BLOB', width: 1900, height: 950 });
  });
  it('MAX_DIMENSION è 1900 (stesso limite di compress.js)', () => {
    expect(MAX_DIMENSION).toBe(1900);
  });
});
