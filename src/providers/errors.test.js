import { describe, it, expect } from 'vitest'
import { DriveError, errorFromResponse } from './errors.js'

describe('DriveError', () => {
  it('ha name="DriveError" e il code specificato', () => {
    const e = new DriveError('msg', 'INVALID_KEY')
    expect(e.name).toBe('DriveError')
    expect(e.code).toBe('INVALID_KEY')
    expect(e.message).toBe('msg')
    expect(e).toBeInstanceOf(Error)
  })
})

describe('errorFromResponse', () => {
  it('mappa 403 → INVALID_KEY', () => {
    const e = errorFromResponse(403, 'API key not valid')
    expect(e.code).toBe('INVALID_KEY')
  })

  it('mappa 404 → NOT_FOUND', () => {
    const e = errorFromResponse(404, 'Folder not found')
    expect(e.code).toBe('NOT_FOUND')
  })

  it('mappa 400 → UNKNOWN', () => {
    const e = errorFromResponse(400, 'Bad request')
    expect(e.code).toBe('UNKNOWN')
  })

  it('mappa status sconosciuto → UNKNOWN', () => {
    const e = errorFromResponse(500, 'Internal server error')
    expect(e.code).toBe('UNKNOWN')
  })
})
