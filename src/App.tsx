import { useEffect, useMemo, useState } from 'react'
import { Database, Loader2, RefreshCw } from 'lucide-react'
import { loadAppData } from './data/loadData'
import { DetailPanel } from './components/DetailPanel'
import { MapPanel } from './components/MapPanel'
import { SearchPanel } from './components/SearchPanel'
import { searchUnits } from './utils/search'
import { formatDateTime, formatNumber } from './utils/format'
import type { AdminFilter, AppData } from './types'

export function App() {
  const [data, setData] = useState<AppData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<AdminFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    loadAppData()
      .then((nextData) => {
        if (!cancelled) {
          setData(nextData)
          setError(null)
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Không tải được dữ liệu')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const results = useMemo(() => {
    if (!data) return []
    return searchUnits(query, filter, data.units, data.searchIndex)
  }, [data, filter, query])

  useEffect(() => {
    if (!results.length) {
      setSelectedId(null)
      return
    }

    if (!selectedId || !results.some((hit) => hit.unit.id === selectedId)) {
      setSelectedId(results[0].unit.id)
    }
  }, [results, selectedId])

  const selectedHit = results.find((hit) => hit.unit.id === selectedId) ?? results[0] ?? null
  const selectedUnit = selectedHit?.unit ?? null

  if (error) {
    return (
      <main className="app-fallback">
        <div className="fallback-panel">
          <Database aria-hidden="true" />
          <h1>Chưa tải được dữ liệu</h1>
          <p>{error}</p>
          <p>Chạy lại lệnh <code>npm run data:build</code> rồi khởi động app.</p>
          <button type="button" onClick={() => window.location.reload()}>
            <RefreshCw aria-hidden="true" />
            Tải lại
          </button>
        </div>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="app-fallback">
        <div className="fallback-panel">
          <Loader2 className="spin" aria-hidden="true" />
          <h1>Đang nạp bản đồ sáp nhập</h1>
          <p>Đang đọc dữ liệu tỉnh, xã/phường và chỉ mục tra cứu.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>Check địa chính cũ mới Việt Nam</h1>
          <p>
            Tra cứu đơn vị hành chính sau sáp nhập 2025 từ dataset{' '}
            <a href={data.metadata.source} target="_blank" rel="noreferrer">
              tmquan/sapnhap-bando-vn
            </a>
            .
          </p>
        </div>
        <div className="source-strip" aria-label="Thống kê dữ liệu">
          <span>{formatNumber(data.metadata.counts.provinces)} tỉnh/thành</span>
          <span>{formatNumber(data.metadata.counts.communes)} xã/phường</span>
          <span>{data.metadata.license}</span>
        </div>
      </header>

      <section className="workspace">
        <SearchPanel
          query={query}
          filter={filter}
          results={results}
          selectedId={selectedUnit?.id ?? null}
          totalUnits={data.units.length}
          onFilterChange={setFilter}
          onQueryChange={setQuery}
          onSelect={setSelectedId}
        />

        <section className="main-stage" aria-label="Bản đồ và chi tiết">
          <MapPanel provinceGeo={data.provinceGeo} selectedUnit={selectedUnit} />
          <DetailPanel
            unit={selectedUnit}
            hit={selectedHit}
            committees={data.committees}
            generatedAt={formatDateTime(data.metadata.generatedAt)}
          />
        </section>
      </section>
    </main>
  )
}
