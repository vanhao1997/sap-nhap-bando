import { describe, expect, it } from 'vitest'
import { includesNormalized, normalizeVietnamese } from './normalize'

describe('normalizeVietnamese', () => {
  it('removes Vietnamese accents and lowercases text', () => {
    expect(normalizeVietnamese('Thành phố Cần Thơ')).toBe('thanh pho can tho')
  })

  it('expands common administrative abbreviations', () => {
    expect(normalizeVietnamese('TP. Cần Thơ')).toBe('thanh pho can tho')
    expect(normalizeVietnamese('P. Ba Đình')).toBe('phuong ba dinh')
    expect(normalizeVietnamese('X. Tân Phú')).toBe('xa tan phu')
  })

  it('normalizes separators and extra whitespace', () => {
    expect(normalizeVietnamese('  Phường Văn Miếu - Quốc Tử Giám  ')).toBe(
      'phuong van mieu quoc tu giam',
    )
  })

  it('supports normalized contains checks', () => {
    expect(includesNormalized('Phường Quán Thánh', 'quan thanh')).toBe(true)
  })
})
