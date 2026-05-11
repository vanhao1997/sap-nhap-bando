import { Building2, ChevronRight, MapPin, Search } from 'lucide-react'
import type { AdminFilter, SearchHit } from '../types'
import { kindLabel, matchTypeLabel } from '../utils/format'

interface SearchPanelProps {
  query: string
  filter: AdminFilter
  results: SearchHit[]
  selectedId: string | null
  totalUnits: number
  onQueryChange: (query: string) => void
  onFilterChange: (filter: AdminFilter) => void
  onSelect: (id: string) => void
}

const FILTERS: Array<{ value: AdminFilter; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'province', label: 'Tỉnh/thành' },
  { value: 'commune', label: 'Xã/phường' },
]

export function SearchPanel({
  query,
  filter,
  results,
  selectedId,
  totalUnits,
  onQueryChange,
  onFilterChange,
  onSelect,
}: SearchPanelProps) {
  return (
    <aside className="search-panel" aria-label="Tra cứu địa chính">
      <div className="search-heading">
        <div>
          <p className="panel-kicker">Tra cứu cũ mới</p>
          <h2>Nhập tên đơn vị hành chính</h2>
        </div>
        <span>{totalUnits.toLocaleString('vi-VN')} đơn vị</span>
      </div>

      <label className="search-box">
        <Search aria-hidden="true" />
        <input
          autoComplete="off"
          inputMode="search"
          placeholder="Nhập tên tỉnh, xã, phường cũ hoặc mới"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>

      <div className="segmented" role="tablist" aria-label="Lọc cấp hành chính">
        {FILTERS.map((item) => (
          <button
            aria-selected={filter === item.value}
            className={filter === item.value ? 'active' : ''}
            key={item.value}
            role="tab"
            type="button"
            onClick={() => onFilterChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="result-summary">
        <strong>{results.length.toLocaleString('vi-VN')}</strong>
        <span>{query.trim() ? 'kết quả phù hợp' : 'gợi ý nổi bật'}</span>
      </div>

      <div className="results-list" role="list">
        {results.length ? (
          results.map((hit) => (
            <button
              className={`result-row ${selectedId === hit.unit.id ? 'selected' : ''}`}
              key={hit.unit.id}
              type="button"
              role="listitem"
              onClick={() => onSelect(hit.unit.id)}
            >
              <span className="row-icon" aria-hidden="true">
                {hit.unit.kind === 'province' ? <Building2 /> : <MapPin />}
              </span>
              <span className="row-main">
                <span className="row-title">{hit.unit.ten}</span>
                <span className="row-meta">
                  {kindLabel(hit.unit.kind)}
                  {hit.unit.parent_ten ? ` · ${hit.unit.parent_ten}` : ''}
                </span>
                <span className="row-reason">
                  {matchTypeLabel(hit.matchType)}: {hit.matchedText}
                </span>
              </span>
              <span className="row-count">
                {hit.unit.n_predecessors || hit.unit.predecessors_list.length || 1}
              </span>
              <ChevronRight className="row-chevron" aria-hidden="true" />
            </button>
          ))
        ) : (
          <div className="empty-state">
            <Search aria-hidden="true" />
            <p>Không tìm thấy đơn vị phù hợp.</p>
            <span>Thử bỏ dấu, rút ngắn tên hoặc đổi bộ lọc cấp hành chính.</span>
          </div>
        )}
      </div>
    </aside>
  )
}
