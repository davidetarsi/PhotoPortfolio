import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { listPhotos } from './googleDrive.js'
import { DriveError } from './errors.js'

function makeFetchResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  }
}

describe('listPhotos', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    sessionStorage.clear()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('ritorna le foto di una singola pagina', async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse({
      files: [
        { id: 'a1', name: '01_alba.jpg', thumbnailLink: 'https://lh3.google.com/abc=s220' },
        { id: 'a2', name: '02_tramonto.jpg', thumbnailLink: 'https://lh3.google.com/def=s220' },
      ],
    }))

    const photos = await listPhotos('folder123', 'apikey456')

    expect(photos).toHaveLength(2)
    expect(photos[0]).toEqual({
      name: '01_alba.jpg',
      gridUrl: 'https://lh3.google.com/abc=s500',
      fullUrl: 'https://lh3.google.com/abc=s1300',
    })
    expect(photos[1].name).toBe('02_tramonto.jpg')
  })

  it('segue il pageToken per raccogliere tutte le pagine', async () => {
    global.fetch
      .mockResolvedValueOnce(makeFetchResponse({
        nextPageToken: 'tok2',
        files: [{ id: 'a', name: '01.jpg', thumbnailLink: 'https://lh3.google.com/p1=s220' }],
      }))
      .mockResolvedValueOnce(makeFetchResponse({
        files: [{ id: 'b', name: '02.jpg', thumbnailLink: 'https://lh3.google.com/p2=s220' }],
      }))

    const photos = await listPhotos('folder123', 'apikey456')

    expect(photos).toHaveLength(2)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('salta i file senza thumbnailLink (non-immagini)', async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse({
      files: [
        { id: 'a', name: '01.jpg', thumbnailLink: 'https://lh3.google.com/x=s220' },
        { id: 'b', name: 'documento.pdf' },
      ],
    }))

    const photos = await listPhotos('folder123', 'apikey456')

    expect(photos).toHaveLength(1)
    expect(photos[0].name).toBe('01.jpg')
  })

  it('lancia DriveError con code INVALID_KEY su 403', async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse(
      { error: { message: 'API key not valid.' } },
      403,
    ))

    await expect(listPhotos('folder123', 'badkey')).rejects.toMatchObject({
      name: 'DriveError',
      code: 'INVALID_KEY',
    })
  })

  it('lancia DriveError con code NOT_FOUND su 404', async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse(
      { error: { message: 'Folder not found.' } },
      404,
    ))

    await expect(listPhotos('folder123', 'apikey456')).rejects.toMatchObject({
      name: 'DriveError',
      code: 'NOT_FOUND',
    })
  })

  it('lancia DriveError con code NETWORK se fetch rigetta', async () => {
    global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(listPhotos('folder123', 'apikey456')).rejects.toMatchObject({
      name: 'DriveError',
      code: 'NETWORK',
    })
  })

  it('usa il cache e non chiama fetch alla seconda invocazione', async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse({
      files: [{ id: 'a', name: '01.jpg', thumbnailLink: 'https://lh3.google.com/x=s220' }],
    }))

    await listPhotos('folder123', 'apikey456')
    const second = await listPhotos('folder123', 'apikey456')

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(second).toHaveLength(1)
  })

  it('chiama fetch di nuovo dopo la scadenza della cache', async () => {
    const expiredTs = Date.now() - 600001
    sessionStorage.setItem(
      'drive_cache_folder123',
      JSON.stringify({ ts: expiredTs, data: [{ name: 'old.jpg', gridUrl: 'g', fullUrl: 'f' }] }),
    )
    global.fetch.mockResolvedValueOnce(makeFetchResponse({
      files: [{ id: 'b', name: 'new.jpg', thumbnailLink: 'https://lh3.google.com/y=s220' }],
    }))

    const photos = await listPhotos('folder123', 'apikey456')

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(photos[0].name).toBe('new.jpg')
  })
})
