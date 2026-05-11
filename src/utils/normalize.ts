const ABBREVIATIONS: Array<[RegExp, string]> = [
  [/\btp\.?\b/g, 'thanh pho'],
  [/\btx\.?\b/g, 'thi xa'],
  [/\btt\.?\b/g, 'thi tran'],
  [/\bq\.?\b/g, 'quan'],
  [/\bp\.?\b/g, 'phuong'],
  [/\bx\.?\b/g, 'xa'],
]

export function normalizeVietnamese(value: string | number | null | undefined): string {
  let normalized = String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()

  for (const [pattern, replacement] of ABBREVIATIONS) {
    normalized = normalized.replace(pattern, replacement)
  }

  return normalized
    .replace(/[–—_-]/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function includesNormalized(haystack: string, needle: string): boolean {
  const normalizedHaystack = normalizeVietnamese(haystack)
  const normalizedNeedle = normalizeVietnamese(needle)
  return Boolean(normalizedNeedle) && normalizedHaystack.includes(normalizedNeedle)
}
