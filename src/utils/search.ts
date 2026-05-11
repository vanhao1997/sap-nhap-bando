import Fuse from 'fuse.js'
import type { AdminFilter, AdminUnit, SearchHit, SearchIndexEntry } from '../types'
import { normalizeVietnamese } from './normalize'

const MATCH_PRIORITY = {
  code: 0,
  'new-name': 0.03,
  'old-name': 0.06,
  keyword: 0.55,
} as const

export function searchUnits(
  query: string,
  filter: AdminFilter,
  units: AdminUnit[],
  searchIndex: SearchIndexEntry[],
  limit = 80,
): SearchHit[] {
  const normalizedQuery = normalizeVietnamese(query)
  const filteredUnits = filterUnits(units, filter)
  const filteredUnitIds = new Set(filteredUnits.map((unit) => unit.id))

  if (!normalizedQuery) {
    return featuredUnits(filteredUnits, limit)
  }

  const searchableEntries = searchIndex.filter((entry) => filteredUnitIds.has(entry.unitId))
  const unitById = new Map(units.map((unit) => [unit.id, unit]))
  const directMatches = searchableEntries
    .filter((entry) => entry.normalized.includes(normalizedQuery))
    .map((entry) => ({ item: entry, score: 0 }))

  const fuse = new Fuse(searchableEntries, {
    keys: ['normalized'],
    includeScore: true,
    threshold: normalizedQuery.length <= 4 ? 0.18 : 0.32,
    ignoreLocation: true,
    minMatchCharLength: Math.min(3, normalizedQuery.length),
  })

  const fuzzyMatches = fuse.search(normalizedQuery).map((result) => ({
    item: result.item,
    score: result.score ?? 1,
  }))

  const oldMatchUnitCount = new Set(
    directMatches
      .filter(({ item }) => item.matchType === 'old-name')
      .map(({ item }) => item.unitId),
  ).size

  const bestByUnit = new Map<string, SearchHit>()

  for (const match of [...directMatches, ...fuzzyMatches]) {
    const unit = unitById.get(match.item.unitId)
    if (!unit) continue

    const score = combinedScore(match.item, match.score, normalizedQuery)
    const hit: SearchHit = {
      unit,
      score,
      matchedField: match.item.field,
      matchedText: match.item.text,
      matchType: match.item.matchType,
      splitCandidate: match.item.matchType === 'old-name' && oldMatchUnitCount > 1,
    }

    const current = bestByUnit.get(unit.id)
    if (!current || hit.score < current.score) {
      bestByUnit.set(unit.id, hit)
    }
  }

  return [...bestByUnit.values()]
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score
      if (a.unit.kind !== b.unit.kind) return a.unit.kind === 'province' ? -1 : 1
      return a.unit.ten.localeCompare(b.unit.ten, 'vi')
    })
    .slice(0, limit)
}

function filterUnits(units: AdminUnit[], filter: AdminFilter): AdminUnit[] {
  return filter === 'all' ? units : units.filter((unit) => unit.kind === filter)
}

function featuredUnits(units: AdminUnit[], limit: number): SearchHit[] {
  return [...units]
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'province' ? -1 : 1
      return (b.population ?? 0) - (a.population ?? 0)
    })
    .slice(0, limit)
    .map((unit, index) => ({
      unit,
      score: index,
      matchedField: 'ten',
      matchedText: unit.ten,
      matchType: 'new-name',
      splitCandidate: false,
    }))
}

function combinedScore(entry: SearchIndexEntry, fuseScore: number, normalizedQuery: string): number {
  const priority = MATCH_PRIORITY[entry.matchType]
  const exactBoost = entry.normalized === normalizedQuery ? -0.25 : 0
  const prefixBoost = entry.normalized.startsWith(normalizedQuery) ? -0.12 : 0
  const typedAdministrativeBoost =
    entry.matchType === 'old-name' && isTypedAdministrativeMatch(entry.normalized, normalizedQuery) ? -0.32 : 0
  const lengthPenalty = Math.min(entry.normalized.length / 240, 0.2)
  return Math.max(0, fuseScore + priority + exactBoost + prefixBoost + typedAdministrativeBoost + lengthPenalty)
}

function isTypedAdministrativeMatch(normalizedText: string, normalizedQuery: string): boolean {
  const prefixes = ['tinh', 'thanh pho', 'thu do', 'phuong', 'xa', 'thi tran', 'thi xa', 'dac khu']
  return prefixes.some((prefix) => normalizedText === `${prefix} ${normalizedQuery}`)
}
