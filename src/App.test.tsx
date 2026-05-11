import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { FeatureCollection } from 'geojson'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import type { AdminUnit, Committee, DatasetMetadata, SearchIndexEntry } from './types'

vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn(() => ({})),
    geoJSON: vi.fn(() => ({
      getBounds: () => ({ isValid: () => true }),
    })),
  },
}))

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: ReactNode }) => <div data-testid="map">{children}</div>,
  TileLayer: () => <div data-testid="tiles" />,
  GeoJSON: () => <div data-testid="province-layer" />,
  Marker: ({ children }: { children: ReactNode }) => <div data-testid="marker">{children}</div>,
  Tooltip: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  useMap: () => ({ fitBounds: vi.fn(), flyTo: vi.fn() }),
}))

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
    decree_url: 'https://example.com',
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
    keywords: [],
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
    keywords: [],
  },
]

const committees: Committee[] = [
  {
    id: 'committee-ba-dinh',
    ma: null,
    ten: 'Phường Ba Đình',
    type: 'Phường',
    parent_ma: '01',
    parent_ten: 'Thủ đô Hà Nội',
    parent_ten_xa: 'Phường Ba Đình',
    address: 'Số 2, phố Trúc Bạch',
    phone: null,
    centroid_lon: 105.838,
    centroid_lat: 21.0385,
    population: 65023,
    predecessors: null,
  },
]

const searchIndex: SearchIndexEntry[] = [
  { unitId: 'province-can-tho', text: 'Thành phố Cần Thơ', normalized: 'thanh pho can tho', field: 'ten', matchType: 'new-name', kind: 'province' },
  { unitId: 'province-can-tho', text: 'tỉnh Sóc Trăng', normalized: 'tinh soc trang', field: 'predecessors_list', matchType: 'old-name', kind: 'province' },
  { unitId: 'commune-ba-dinh', text: 'Phường Ba Đình', normalized: 'phuong ba dinh', field: 'ten', matchType: 'new-name', kind: 'commune' },
  { unitId: 'commune-ba-dinh', text: 'Phường Quán Thánh', normalized: 'phuong quan thanh', field: 'predecessors_list', matchType: 'old-name', kind: 'commune' },
]

const metadata: DatasetMetadata = {
  dataset: 'tmquan/sapnhap-bando-vn',
  source: 'https://huggingface.co/datasets/tmquan/sapnhap-bando-vn',
  generatedAt: '2026-05-11T04:00:00.000Z',
  license: 'CC-BY-NC 4.0',
  counts: {
    provinces: 1,
    communes: 1,
    committees: 1,
    searchAliases: 4,
  },
}

const provinceGeo: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { ma: '92', ten: 'Thành phố Cần Thơ' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[105.5, 9.5], [106, 9.5], [106, 10], [105.5, 10], [105.5, 9.5]]],
      },
    },
  ],
}

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      const payload = url.includes('units')
        ? units
        : url.includes('committees')
          ? committees
          : url.includes('search-index')
            ? searchIndex
            : url.includes('province-geo')
              ? provinceGeo
              : metadata

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(payload),
      } as Response)
    }))
  })

  it('searches by old province name and updates the detail panel', async () => {
    render(<App />)

    const input = await screen.findByPlaceholderText('Nhập tên tỉnh, xã, phường cũ hoặc mới')
    fireEvent.change(input, { target: { value: 'Soc Trang' } })

    await waitFor(() => expect(screen.getAllByText('Thành phố Cần Thơ').length).toBeGreaterThan(0))
    expect(screen.getByText(/Khớp tên cũ qua trường/)).toBeInTheDocument()
    expect(screen.getAllByText(/tỉnh Sóc Trăng/).length).toBeGreaterThan(0)
  })

  it('filters communes and shows a selected marker state', async () => {
    render(<App />)

    const input = await screen.findByPlaceholderText('Nhập tên tỉnh, xã, phường cũ hoặc mới')
    fireEvent.click(screen.getByRole('tab', { name: 'Xã/phường' }))
    fireEvent.change(input, { target: { value: 'quan thanh' } })

    await waitFor(() => expect(screen.getAllByText('Phường Ba Đình').length).toBeGreaterThan(0))
    expect(screen.getByTestId('marker')).toBeInTheDocument()
    expect(screen.getAllByText('Số 2, phố Trúc Bạch').length).toBeGreaterThan(0)
  })
})
