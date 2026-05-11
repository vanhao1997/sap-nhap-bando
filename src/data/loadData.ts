import type { FeatureCollection } from 'geojson'
import type { AdminUnit, AppData, Committee, DatasetMetadata, SearchIndexEntry } from '../types'

export async function loadAppData(): Promise<AppData> {
  const base = import.meta.env.BASE_URL
  const [units, committees, searchIndex, provinceGeo, metadata] = await Promise.all([
    fetchJson<AdminUnit[]>(`${base}data/units.json`),
    fetchJson<Committee[]>(`${base}data/committees.json`),
    fetchJson<SearchIndexEntry[]>(`${base}data/search-index.json`),
    fetchJson<FeatureCollection>(`${base}data/province-geo.json`),
    fetchJson<DatasetMetadata>(`${base}data/metadata.json`),
  ])

  return { units, committees, searchIndex, provinceGeo, metadata }
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Không tải được dữ liệu: ${url}`)
  }
  return response.json() as Promise<T>
}
