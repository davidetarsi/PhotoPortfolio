import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { listPhotos } from './r2.js'

function makeFetchResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  }
}

const BASE = 'https://pub-abc123.r2.dev'

describe('r2 listPhotos', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    sessionStorage.clear()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('fetcha il manifest e costruisce gli URL corretti', async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse(['01_alba.webp', '02_tramonto.webp']))

    const photos = await listPhotos('sport-album', BASE)

    expect(global.fetch).toHaveBeenCalledWith(`${BASE}/sport-album/manifest.json`)
    expect(photos).toHaveLength(2)
    expect(photos[0]).toEqual({
      name: '01_alba.webp',
      gridUrl: `${BASE}/sport-album/01_alba.webp`,
      fullUrl: `${BASE}/sport-album/01_alba.webp`,
    })
    expect(photos[1]).toEqual({
      name: '02_tramonto.webp',
      gridUrl: `${BASE}/sport-album/02_tramonto.webp`,
      fullUrl: `${BASE}/sport-album/02_tramonto.webp`,
    })
  })

  it('usa la cache e non chiama fetch alla seconda invocazione', async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse(['foto.webp']))

    await listPhotos('sport-album', BASE)
    const second = await listPhotos('sport-album', BASE)

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(second).toHaveLength(1)
  })

  it('lancia Error con code NETWORK se fetch rigetta', async () => {
    global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(listPhotos('sport-album', BASE)).rejects.toMatchObject({
      code: 'NETWORK',
    })
  })

  it('lancia Error con code NOT_FOUND se manifest risponde 404', async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse({}, 404))

    await expect(listPhotos('sport-album', BASE)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })

  it('lancia Error con code UNKNOWN per altri status HTTP', async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse({}, 500))

    await expect(listPhotos('sport-album', BASE)).rejects.toMatchObject({
      code: 'UNKNOWN',
    })
  })
})
