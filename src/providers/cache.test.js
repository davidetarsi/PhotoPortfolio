import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getCached, setCached } from './cache.js'

describe('getCached', () => {
  beforeEach(() => sessionStorage.clear())

  it('ritorna null per una chiave assente', () => {
    expect(getCached('nonexistent')).toBeNull()
  })

  it('ritorna i dati salvati entro il TTL', () => {
    const data = [{ name: 'a.jpg', gridUrl: 'g', fullUrl: 'f' }]
    setCached('folder1', data)
    expect(getCached('folder1')).toEqual(data)
  })

  it('ritorna null dopo la scadenza del TTL (600000 ms)', () => {
    const expiredTs = Date.now() - 600001
    sessionStorage.setItem(
      'cache_folder1',
      JSON.stringify({ ts: expiredTs, data: [{ name: 'old.jpg' }] }),
    )
    expect(getCached('folder1')).toBeNull()
  })

  it('ritorna i dati se il timestamp è esattamente al limite (599999 ms fa)', () => {
    const almostExpiredTs = Date.now() - 599999
    sessionStorage.setItem(
      'cache_folder1',
      JSON.stringify({ ts: almostExpiredTs, data: [{ name: 'fresh.jpg' }] }),
    )
    expect(getCached('folder1')).not.toBeNull()
  })

  it('ritorna null e non lancia se il valore in sessionStorage è JSON invalido', () => {
    sessionStorage.setItem('cache_folder1', 'not-json{{{')
    expect(() => getCached('folder1')).not.toThrow()
    expect(getCached('folder1')).toBeNull()
  })
})

describe('setCached', () => {
  beforeEach(() => sessionStorage.clear())

  it('non lancia se sessionStorage non è disponibile', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('QuotaExceededError')
    })
    expect(() => setCached('folder1', [])).not.toThrow()
  })
})
