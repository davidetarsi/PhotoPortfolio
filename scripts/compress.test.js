// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import sharp from 'sharp';
import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync } from 'fs';
import { parseArgs, isSupportedFile, processImage, processDir } from './compress.js';

describe('parseArgs', () => {
  it('estrae --input', () => {
    expect(parseArgs(['--input', '/path/to/folder']))
      .toEqual({ input: '/path/to/folder', help: false });
  });

  it('estrae --help', () => {
    expect(parseArgs(['--help']))
      .toEqual({ input: null, help: true });
  });

  it('restituisce input null se --input è assente', () => {
    expect(parseArgs([]))
      .toEqual({ input: null, help: false });
  });

  it('ignora --input senza valore successivo', () => {
    expect(parseArgs(['--input']))
      .toEqual({ input: null, help: false });
  });
});

describe('isSupportedFile', () => {
  it('accetta le estensioni supportate (case-insensitive)', () => {
    for (const name of ['foto.jpg', 'foto.JPEG', 'foto.png', 'foto.heic', 'foto.tif', 'foto.tiff', 'foto.webp']) {
      expect(isSupportedFile(name), name).toBe(true);
    }
  });

  it('rifiuta RAW e altri formati', () => {
    for (const name of ['foto.cr2', 'foto.nef', 'foto.arw', 'doc.pdf', '.DS_Store', 'foto']) {
      expect(isSupportedFile(name), name).toBe(false);
    }
  });
});

describe('processImage', () => {
  let testRoot;

  beforeAll(async () => {
    testRoot = join(tmpdir(), `compress-img-test-${Date.now()}`);
    await mkdir(testRoot, { recursive: true });
    await sharp({
      create: { width: 200, height: 300, channels: 3, background: { r: 180, g: 100, b: 50 } },
    })
      .jpeg()
      .toFile(join(testRoot, 'input.jpg'));
  });

  afterAll(async () => {
    await rm(testRoot, { recursive: true, force: true });
  });

  it('converte JPEG in WebP e rispetta withoutEnlargement', async () => {
    const outPath = join(testRoot, 'output.webp');
    await processImage(join(testRoot, 'input.jpg'), outPath);
    const meta = await sharp(outPath).metadata();
    expect(meta.format).toBe('webp');
    // 200×300 < 1900 su entrambi i lati: non deve essere ingrandita
    expect(meta.width).toBe(200);
    expect(meta.height).toBe(300);
  });
});

describe('processDir', () => {
  let testRoot;
  let originaliDir;
  let optimizedDir;

  beforeAll(async () => {
    testRoot = join(tmpdir(), `compress-dir-test-${Date.now()}`);
    originaliDir = join(testRoot, 'originali');
    optimizedDir = join(testRoot, 'optimized');
    await mkdir(originaliDir, { recursive: true });

    // Immagine 200×300 JPEG
    await sharp({
      create: { width: 200, height: 300, channels: 3, background: { r: 180, g: 100, b: 50 } },
    })
      .jpeg()
      .toFile(join(originaliDir, 'test.jpg'));

    // File non supportato — deve essere ignorato
    await sharp({
      create: { width: 50, height: 50, channels: 3, background: { r: 0, g: 0, b: 0 } },
    })
      .png()
      .toFile(join(originaliDir, 'thumbs.db'));
  });

  afterAll(async () => {
    await rm(testRoot, { recursive: true, force: true });
  });

  it('genera test.webp nella cartella optimized/', async () => {
    const result = await processDir(originaliDir, optimizedDir);
    expect(result.ok).toBe(1);
    expect(result.errors).toBe(0);
    expect(existsSync(join(optimizedDir, 'test.webp'))).toBe(true);
  });

  it('output è WebP con dimensioni ≤ 1900px su ogni lato', async () => {
    const meta = await sharp(join(optimizedDir, 'test.webp')).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBeLessThanOrEqual(1900);
    expect(meta.height).toBeLessThanOrEqual(1900);
  });

  it('non ingrandisce immagini già piccole (200×300 rimane 200×300)', async () => {
    const meta = await sharp(join(optimizedDir, 'test.webp')).metadata();
    expect(meta.width).toBe(200);
    expect(meta.height).toBe(300);
  });

  it('una seconda esecuzione svuota e rigenera optimized/', async () => {
    await sharp({
      create: { width: 10, height: 10, channels: 3, background: { r: 0, g: 0, b: 0 } },
    })
      .webp()
      .toFile(join(optimizedDir, 'vecchio.webp'));

    await processDir(originaliDir, optimizedDir);

    expect(existsSync(join(optimizedDir, 'test.webp'))).toBe(true);
    expect(existsSync(join(optimizedDir, 'vecchio.webp'))).toBe(false);
  });
});
