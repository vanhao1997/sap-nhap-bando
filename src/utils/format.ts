import type { AdminKind, MatchType } from '../types'

export function kindLabel(kind: AdminKind): string {
  return kind === 'province' ? 'Tỉnh/thành' : 'Xã/phường/đặc khu'
}

export function matchTypeLabel(matchType: MatchType): string {
  switch (matchType) {
    case 'old-name':
      return 'Khớp tên cũ'
    case 'new-name':
      return 'Khớp tên mới'
    case 'code':
      return 'Khớp mã'
    case 'keyword':
      return 'Khớp từ khóa'
  }
}

export function formatNumber(value: number | null, suffix = ''): string {
  if (value === null || Number.isNaN(value)) return 'Chưa có'
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)}${suffix}`
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
