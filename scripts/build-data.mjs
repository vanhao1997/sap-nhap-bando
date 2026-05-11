import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parquetReadObjects } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import iconv from 'iconv-lite'

const DATASET = 'tmquan/sapnhap-bando-vn'
const HUB_RAW = `https://huggingface.co/datasets/${DATASET}/resolve/main`

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '../public/data')

function normalizeVietnamese(value) {
  return repairText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\btp\.?\b/g, 'thanh pho')
    .replace(/\btx\.?\b/g, 'thi xa')
    .replace(/\btt\.?\b/g, 'thi tran')
    .replace(/\bq\.?\b/g, 'quan')
    .replace(/\bp\.?\b/g, 'phuong')
    .replace(/\bx\.?\b/g, 'xa')
    .replace(/[–—_-]/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function compactUnit(row) {
  return {
    id: textOrNull(row.id),
    kind: textOrNull(row.kind),
    ma: textOrNull(row.ma),
    ten: textOrNull(row.ten),
    type: textOrNull(row.type),
    ten_short: textOrNull(row.ten_short),
    area_km2: numberOrNull(row.area_km2),
    population: numberOrNull(row.population),
    density: numberOrNull(row.density),
    capital: textOrNull(row.capital),
    address: textOrNull(row.address),
    phone: textOrNull(row.phone),
    decree: textOrNull(row.decree),
    decree_url: textOrNull(row.decree_url),
    predecessors: textOrNull(row.predecessors),
    parent_ma: textOrNull(row.parent_ma),
    parent_ten: textOrNull(row.parent_ten),
    centroid_lon: numberOrNull(row.centroid_lon),
    centroid_lat: numberOrNull(row.centroid_lat),
    bbox: Array.isArray(row.bbox) ? row.bbox.map(numberOrNull) : [],
    geom_type: textOrNull(row.geom_type),
    macro_region: textOrNull(row.macro_region),
    predecessors_list: cleanList(row.predecessors_list),
    n_predecessors: Number.isFinite(Number(row.n_predecessors)) ? Number(row.n_predecessors) : 0,
    keywords: cleanList(row.keywords),
  }
}

function compactCommittee(row) {
  return {
    id: textOrNull(row.id),
    ma: textOrNull(row.ma),
    ten: textOrNull(row.ten),
    type: textOrNull(row.type),
    parent_ma: textOrNull(row.parent_ma),
    parent_ten: textOrNull(row.parent_ten),
    parent_ten_xa: textOrNull(row.parent_ten_xa) ?? textOrNull(row.ten),
    address: textOrNull(row.address) ?? textOrNull(row.capital),
    phone: textOrNull(row.phone),
    centroid_lon: numberOrNull(row.centroid_lon),
    centroid_lat: numberOrNull(row.centroid_lat),
    population: numberOrNull(row.population),
    predecessors: textOrNull(row.predecessors),
  }
}

function textOrNull(value) {
  const text = repairText(value).trim()
  return text || null
}

function repairText(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return ''
  const text = String(value)
  if (!looksMojibake(text)) return text

  try {
    return iconv.encode(text, 'win1252').toString('utf8')
  } catch {
    return text
  }
}

function looksMojibake(text) {
  return /[ÃÂÄÅÆ]/.test(text) || /á[º»]/.test(text)
}

function numberOrNull(value) {
  const next = Number(value)
  return Number.isFinite(next) ? next : null
}

function cleanList(value) {
  return Array.isArray(value)
    ? value.map((item) => repairText(item).trim()).filter(Boolean)
    : []
}

function addAlias(entries, seen, unit, rawText, matchType, field) {
  const text = String(rawText ?? '').trim()
  const normalized = normalizeVietnamese(text)
  if (!normalized) return

  const key = `${unit.id}|${field}|${normalized}`
  if (seen.has(key)) return
  seen.add(key)

  entries.push({
    unitId: unit.id,
    text,
    normalized,
    field,
    matchType,
    kind: unit.kind,
  })
}

function buildSearchIndex(units) {
  const entries = []
  const seen = new Set()

  for (const unit of units) {
    addAlias(entries, seen, unit, unit.ten, 'new-name', 'ten')
    addAlias(entries, seen, unit, unit.ten_short, 'new-name', 'ten_short')
    addAlias(entries, seen, unit, unit.ma, 'code', 'ma')
    addAlias(entries, seen, unit, unit.parent_ten, 'new-name', 'parent_ten')
    addAlias(entries, seen, unit, unit.predecessors, 'old-name', 'predecessors')

    for (const predecessor of unit.predecessors_list) {
      addAlias(entries, seen, unit, predecessor, 'old-name', 'predecessors_list')
    }

    for (const keyword of unit.keywords) {
      addAlias(entries, seen, unit, keyword, 'keyword', 'keywords')
    }
  }

  return entries
}

async function fetchJson(url) {
  const response = await fetchWithRetry(url)
  return response.json()
}

async function fetchJsonAllowingNaN(url) {
  const response = await fetchWithRetry(url)
  const text = await response.text()
  return JSON.parse(text.replace(/\bNaN\b/g, 'null'))
}

async function fetchWithRetry(url, attempts = 4, accept = 'application/json') {
  let lastError

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept,
          'user-agent': 'sap-nhap-bando-vn-data-builder',
        },
      })

      if (response.ok) return response

      lastError = new Error(`Fetch failed ${response.status} ${response.statusText}: ${url}`)
      if (response.status < 500 && response.status !== 429) break
    } catch (error) {
      lastError = error
    }

    await delay(450 * attempt)
  }

  throw lastError
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function fetchParquetRows(configName) {
  const url = `${HUB_RAW}/data/${configName}.parquet`
  const response = await fetchWithRetry(url, 4, 'application/octet-stream')
  const file = await response.arrayBuffer()
  const rows = await parquetReadObjects({ file, compressors })
  console.log(`Read ${configName}: ${rows.length} rows from parquet`)
  return rows
}

async function main() {
  await mkdir(outDir, { recursive: true })

  const provinceRows = await fetchParquetRows('provinces')
  const communeRows = await fetchParquetRows('communes')
  const committeeRows = await fetchParquetRows('committees')
  const provinceGeo = await fetchJsonAllowingNaN(`${HUB_RAW}/geo/provinces.geojson`)

  const units = [...provinceRows.map(compactUnit), ...communeRows.map(compactUnit)].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'province' ? -1 : 1
    return `${a.parent_ten ?? ''} ${a.ten}`.localeCompare(`${b.parent_ten ?? ''} ${b.ten}`, 'vi')
  })

  const committees = committeeRows.map(compactCommittee).sort((a, b) => {
    return `${a.parent_ten ?? ''} ${a.parent_ten_xa ?? a.ten}`.localeCompare(
      `${b.parent_ten ?? ''} ${b.parent_ten_xa ?? b.ten}`,
      'vi',
    )
  })

  const searchIndex = buildSearchIndex(units)

  await Promise.all([
    writeJson('units.json', units),
    writeJson('committees.json', committees),
    writeJson('search-index.json', searchIndex),
    writeJson('province-geo.json', provinceGeo),
    writeJson('metadata.json', {
      dataset: DATASET,
      source: `https://huggingface.co/datasets/${DATASET}`,
      generatedAt: new Date().toISOString(),
      counts: {
        provinces: provinceRows.length,
        communes: communeRows.length,
        committees: committeeRows.length,
        searchAliases: searchIndex.length,
      },
      license: 'CC-BY-NC 4.0',
    }),
  ])

  console.log(`Data written to ${outDir}`)
}

async function writeJson(filename, payload) {
  const file = path.join(outDir, filename)
  await writeFile(file, `${JSON.stringify(payload)}\n`, 'utf8')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
