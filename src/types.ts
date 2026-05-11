import type { FeatureCollection } from 'geojson'

export type AdminKind = 'province' | 'commune'
export type MatchType = 'old-name' | 'new-name' | 'code' | 'keyword'
export type AdminFilter = 'all' | AdminKind

export interface AdminUnit {
  id: string
  kind: AdminKind
  ma: string | null
  ten: string
  type: string | null
  ten_short: string | null
  area_km2: number | null
  population: number | null
  density: number | null
  capital: string | null
  address: string | null
  phone: string | null
  decree: string | null
  decree_url: string | null
  predecessors: string | null
  parent_ma: string | null
  parent_ten: string | null
  centroid_lon: number | null
  centroid_lat: number | null
  bbox: Array<number | null>
  geom_type: string | null
  macro_region: string | null
  predecessors_list: string[]
  n_predecessors: number
  keywords: string[]
}

export interface Committee {
  id: string
  ma: string | null
  ten: string
  type: string | null
  parent_ma: string | null
  parent_ten: string | null
  parent_ten_xa: string | null
  address: string | null
  phone: string | null
  centroid_lon: number | null
  centroid_lat: number | null
  population: number | null
  predecessors: string | null
}

export interface SearchIndexEntry {
  unitId: string
  text: string
  normalized: string
  field: string
  matchType: MatchType
  kind: AdminKind
}

export interface SearchHit {
  unit: AdminUnit
  score: number
  matchedField: string
  matchedText: string
  matchType: MatchType
  splitCandidate: boolean
}

export interface DatasetMetadata {
  dataset: string
  source: string
  generatedAt: string
  counts: {
    provinces: number
    communes: number
    committees: number
    searchAliases: number
  }
  license: string
}

export interface AppData {
  units: AdminUnit[]
  committees: Committee[]
  searchIndex: SearchIndexEntry[]
  provinceGeo: FeatureCollection
  metadata: DatasetMetadata
}
