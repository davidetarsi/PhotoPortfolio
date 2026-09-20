import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseUploadArgs, uploadAlbum } from './upload.js'

const { mockReaddir, mockReadFile } = vi.hoisted(() => ({
  mockReaddir: vi.fn(),
  mockReadFile: vi.fn().mockResolvedValue(Buffer.from('fake')),
}))

vi.mock('@aws-sdk/client-s3', () => {
  const mockSend = vi.fn().mockResolvedValue({})
  const S3Client = vi.fn(function () { this.send = mockSend })
  const PutObjectCommand = vi.fn(function (params) { this.params = params })
  return { S3Client, PutObjectCommand }
})

vi.mock('fs/promises', () => ({
  default: { readdir: mockReaddir, readFile: mockReadFile },
  readdir: mockReaddir,
  readFile: mockReadFile,
}))

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, existsSync: vi.fn().mockReturnValue(true) }
})

describe('parseUploadArgs', () => {
  it('ritorna album e input quando entrambi sono forniti', () => {
    const result = parseUploadArgs(['--album', 'sport-album', '--input', '/path/to/optimized'])
    expect(result).toEqual({ album: 'sport-album', input: '/path/to/optimized', help: false })
  })

  it('ritorna help: true con --help', () => {
    const result = parseUploadArgs(['--help'])
    expect(result).toEqual({ album: null, input: null, help: true })
  })

  it('ritorna null per campi mancanti', () => {
    const result = parseUploadArgs([])
    expect(result).toEqual({ album: null, input: null, help: false })
  })
})

describe('uploadAlbum', () => {
  const fakeManifest = [
    { name: '01_alba.webp', width: 800, height: 600 },
    { name: '02_foto.webp', width: 600, height: 800 },
  ]

  beforeEach(() => {
    mockReaddir.mockReset()
    mockReadFile.mockReset()
    mockReadFile.mockImplementation((filePath) => {
      if (String(filePath).endsWith('manifest.json')) {
        return Promise.resolve(Buffer.from(JSON.stringify(fakeManifest)))
      }
      return Promise.resolve(Buffer.from('fake'))
    })
    process.env.R2_ACCOUNT_ID = 'acc'
    process.env.R2_ACCESS_KEY_ID = 'key'
    process.env.R2_SECRET_ACCESS_KEY = 'secret'
    process.env.R2_BUCKET_NAME = 'bucket'
  })

  it('carica i file .webp e legge il manifest da disco', async () => {
    mockReaddir.mockResolvedValue(['02_foto.webp', '01_alba.webp', 'non-supportato.txt'])

    const result = await uploadAlbum('sport-album', '/fake/dir')

    expect(result.uploaded).toBe(2)
    expect(result.manifest).toEqual(fakeManifest)
  })
})
