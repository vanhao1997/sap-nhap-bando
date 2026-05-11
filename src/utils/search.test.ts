import { describe, expect, it } from 'vitest'
import type { AdminUnit, SearchIndexEntry } from '../types'
import { searchUnits } from './search'

const units: AdminUnit[] = [
  {
    id: 'province-can-tho',
    kind: 'province',
    ma: '92',
    ten: 'Thành phố Cần Thơ',
    type: 'Thành phố',
    ten_short: 'Cần Thơ',
    area_km2: 6360.83,
    population: 4199824,
    density: 660.26,
    capital: 'Cần Thơ (cũ)',
    address: null,
    phone: null,
    decree: 'Nghị quyết số 202/2025/QH15',
    decree_url: null,
    predecessors: 'thành phố Cần Thơ, tỉnh Sóc Trăng và tỉnh Hậu Giang',
    parent_ma: null,
    parent_ten: null,
    centroid_lon: 105.7569,
    centroid_lat: 9.7437,
    bbox: [],
    geom_type: 'MultiPolygon',
    macro_region: 'mekong_delta',
    predecessors_list: ['thành phố Cần Thơ', 'tỉnh Sóc Trăng', 'tỉnh Hậu Giang'],
    n_predecessors: 3,
    keywords: ['cần thơ', 'sóc trăng'],
  },
  {
    id: 'commune-ba-dinh',
    kind: 'commune',
    ma: '00004',
    ten: 'Phường Ba Đình',
    type: 'Phường',
    ten_short: 'Ba Đình',
    area_km2: 2.97,
    population: 65023,
    density: 21893.26,
    capital: 'Số 2, phố Trúc Bạch',
    address: null,
    phone: null,
    decree: 'Nghị quyết số 1656/NQ-UBTVQH15',
    decree_url: null,
    predecessors: 'Phường Quán Thánh, Phường Trúc Bạch',
    parent_ma: '01',
    parent_ten: 'Thủ đô Hà Nội',
    centroid_lon: 105.838,
    centroid_lat: 21.0385,
    bbox: [],
    geom_type: 'MultiPolygon',
    macro_region: 'red_river_delta',
    predecessors_list: ['Phường Quán Thánh', 'Phường Trúc Bạch'],
    n_predecessors: 2,
    keywords: ['ba đình'],
  },
]

const searchIndex: SearchIndexEntry[] = [
  { unitId: 'province-can-tho', text: 'Thành phố Cần Thơ', normalized: 'thanh pho can tho', field: 'ten', matchType: 'new-name', kind: 'province' },
  { unitId: 'province-can-tho', text: 'Cần Thơ', normalized: 'can tho', field: 'ten_short', matchType: 'new-name', kind: 'province' },
  { unitId: 'province-can-tho', text: 'tỉnh Sóc Trăng', normalized: 'tinh soc trang', field: 'predecessors_list', matchType: 'old-name', kind: 'province' },
  { unitId: 'commune-ba-dinh', text: 'Phường Ba Đình', normalized: 'phuong ba dinh', field: 'ten', matchType: 'new-name', kind: 'commune' },
  { unitId: 'commune-ba-dinh', text: 'Phường Quán Thánh', normalized: 'phuong quan thanh', field: 'predecessors_list', matchType: 'old-name', kind: 'commune' },
]

describe('searchUnits', () => {
  it('returns a new province for its current name without accents', () => {
    const hits = searchUnits('can tho', 'all', units, searchIndex)
    expect(hits[0].unit.ten).toBe('Thành phố Cần Thơ')
    expect(hits[0].matchType).toBe('new-name')
  })

  it('returns a new unit from an old predecessor name', () => {
    const hits = searchUnits('Sóc Trăng', 'all', units, searchIndex)
    expect(hits[0].unit.ten).toBe('Thành phố Cần Thơ')
    expect(hits[0].matchType).toBe('old-name')
  })

  it('returns a commune by its new name', () => {
    const hits = searchUnits('Phường Ba Đình', 'commune', units, searchIndex)
    expect(hits[0].unit.id).toBe('commune-ba-dinh')
  })

  it('matches old commune names without accents', () => {
    const hits = searchUnits('quan thanh', 'commune', units, searchIndex)
    expect(hits[0].unit.ten).toBe('Phường Ba Đình')
    expect(hits[0].matchedText).toBe('Phường Quán Thánh')
  })
})
