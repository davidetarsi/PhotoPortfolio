import { describe, it, expect } from 'vitest'
import { parseUploadArgs } from './upload.js'

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
