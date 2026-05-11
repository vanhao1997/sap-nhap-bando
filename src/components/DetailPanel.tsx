import { AlertTriangle, ExternalLink, FileText, Landmark, MapPinned, Phone } from 'lucide-react'
import type { AdminUnit, Committee, SearchHit } from '../types'
import { formatNumber, kindLabel, matchTypeLabel } from '../utils/format'
import { normalizeVietnamese } from '../utils/normalize'

interface DetailPanelProps {
  unit: AdminUnit | null
  hit: SearchHit | null
  committees: Committee[]
  generatedAt: string
}

export function DetailPanel({ unit, hit, committees, generatedAt }: DetailPanelProps) {
  if (!unit) {
    return (
      <aside className="detail-panel" aria-label="Chi tiết đơn vị">
        <div className="empty-state spacious">
          <MapPinned aria-hidden="true" />
          <p>Chọn một kết quả để xem chi tiết.</p>
        </div>
      </aside>
    )
  }

  const matchedCommittees = findCommittees(unit, committees)
  const predecessorCount = unit.n_predecessors || unit.predecessors_list.length

  return (
    <aside className="detail-panel" aria-label={`Chi tiết ${unit.ten}`}>
      <div className="detail-header">
        <div>
          <p className="panel-kicker">{kindLabel(unit.kind)}</p>
          <h2>{unit.ten}</h2>
          <span>{unit.parent_ten ?? 'Đơn vị cấp tỉnh'}</span>
        </div>
        <div className="unit-code">
          <span>Mã</span>
          <strong>{unit.ma || 'N/A'}</strong>
        </div>
      </div>

      {hit?.splitCandidate ? (
        <div className="warning-line" role="note">
          <AlertTriangle aria-hidden="true" />
          Tên cũ này có thể liên quan nhiều đơn vị mới hoặc có phần diện tích bị chia/tách.
        </div>
      ) : null}

      <dl className="stats-grid">
        <div>
          <dt>Diện tích</dt>
          <dd>{formatNumber(unit.area_km2, ' km²')}</dd>
        </div>
        <div>
          <dt>Dân số</dt>
          <dd>{formatNumber(unit.population, ' người')}</dd>
        </div>
        <div>
          <dt>Mật độ</dt>
          <dd>{formatNumber(unit.density, ' người/km²')}</dd>
        </div>
        <div>
          <dt>Tiền nhiệm</dt>
          <dd>{predecessorCount || 'Chưa có'}</dd>
        </div>
      </dl>

      <section className="detail-section">
        <h3>
          <FileText aria-hidden="true" />
          Kết quả khớp
        </h3>
        <p>
          {hit ? `${matchTypeLabel(hit.matchType)} qua trường "${fieldLabel(hit.matchedField)}": ${hit.matchedText}` : 'Đơn vị gợi ý.'}
        </p>
      </section>

      <section className="detail-section">
        <h3>
          <Landmark aria-hidden="true" />
          Văn bản pháp lý
        </h3>
        <p>{unit.decree ?? 'Chưa có thông tin nghị quyết.'}</p>
        {unit.decree_url ? (
          <a className="external-link" href={unit.decree_url} target="_blank" rel="noreferrer">
            Mở nguồn văn bản
            <ExternalLink aria-hidden="true" />
          </a>
        ) : null}
      </section>

      <section className="detail-section">
        <h3>
          <MapPinned aria-hidden="true" />
          Đơn vị tiền nhiệm
        </h3>
        {unit.predecessors_list.length ? (
          <ul className="predecessor-list">
            {unit.predecessors_list.map((predecessor) => (
              <li key={predecessor}>{predecessor}</li>
            ))}
          </ul>
        ) : (
          <p>{unit.predecessors ?? 'Chưa có dữ liệu tiền nhiệm.'}</p>
        )}
      </section>

      <section className="detail-section">
        <h3>
          <Phone aria-hidden="true" />
          Trụ sở và liên hệ
        </h3>
        <p>{unit.capital ?? unit.address ?? matchedCommittees[0]?.address ?? 'Chưa có địa chỉ trụ sở.'}</p>
        {unit.phone ? <p>Điện thoại: {unit.phone}</p> : null}
        {matchedCommittees.length ? (
          <ul className="committee-list">
            {matchedCommittees.slice(0, 3).map((committee) => (
              <li key={committee.id}>
                <strong>{committee.ten}</strong>
                {committee.address ? <span>{committee.address}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <footer className="detail-footnote">
        Dữ liệu cập nhật từ Hugging Face lúc {generatedAt}. Giấy phép CC-BY-NC 4.0, cần kiểm tra điều khoản nguồn trước khi dùng thương mại.
      </footer>
    </aside>
  )
}

function findCommittees(unit: AdminUnit, committees: Committee[]): Committee[] {
  if (unit.kind === 'province') return []

  const unitName = normalizeVietnamese(unit.ten)
  const parentCode = unit.parent_ma

  return committees.filter((committee) => {
    if (parentCode && committee.parent_ma !== parentCode) return false
    const committeeUnitName = normalizeVietnamese(committee.parent_ten_xa ?? committee.ten)
    return committeeUnitName === unitName
  })
}

function fieldLabel(field: string): string {
  switch (field) {
    case 'ten':
      return 'tên mới'
    case 'ten_short':
      return 'tên ngắn'
    case 'predecessors':
    case 'predecessors_list':
      return 'đơn vị tiền nhiệm'
    case 'parent_ten':
      return 'tỉnh/thành cha'
    case 'ma':
      return 'mã hành chính'
    case 'keywords':
      return 'từ khóa'
    default:
      return field
  }
}
