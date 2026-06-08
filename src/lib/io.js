import { uid, randomColor } from './utils'
import { migratePositions } from './grid'

// ---------- Helpers de descarga ----------

export function downloadFile(filename, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function stamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`
}

// ---------- CSV ----------

function csvEscape(value) {
  const s = String(value ?? '')
  if (/[",\n;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

// Exporta a CSV: Código, Nombre, Estantería, Estante
export function exportCSV(shelves) {
  const rows = [['Codigo', 'Nombre', 'Estanteria', 'Estante']]
  shelves.forEach((shelf) => {
    shelf.levels.forEach((lvl) => {
      lvl.products.forEach((p) => {
        rows.push([p.code, p.name, shelf.name, lvl.label])
      })
    })
  })
  const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n')
  downloadFile(`inventario_${stamp()}.csv`, '\uFEFF' + csv, 'text/csv')
}

// Parser CSV tolerante (comillas, comas dentro de campos, separador , o ;)
function parseCSV(text) {
  const clean = text.replace(/^\uFEFF/, '')
  // Detectar separador en la primera línea
  const firstLine = clean.split(/\r?\n/)[0] || ''
  const sep = firstLine.split(';').length > firstLine.split(',').length ? ';' : ','

  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i]
    if (inQuotes) {
      if (c === '"') {
        if (clean[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === sep) {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && clean[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += c
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

// Importa CSV y reconstruye la estructura de estanterías.
// Formato esperado de columnas: Codigo, Nombre, Estanteria, Estante
// Devuelve { shelves } o lanza un error con mensaje legible.
export function importCSV(text, existingShelves = []) {
  const rows = parseCSV(text)
  if (rows.length < 2) {
    throw new Error('El CSV no contiene filas de datos.')
  }

  const header = rows[0].map((h) => h.trim().toLowerCase())
  const idxCode = header.findIndex((h) => h.includes('cod'))
  const idxName = header.findIndex((h) => h.includes('nombre') || h.includes('name'))
  const idxShelf = header.findIndex((h) => h.includes('estanter') || h.includes('shelf'))
  const idxLevel = header.findIndex(
    (h) => (h.includes('estante') && !h.includes('estanter')) || h.includes('nivel') || h.includes('level'),
  )

  if (idxCode === -1 || idxName === -1 || idxShelf === -1 || idxLevel === -1) {
    throw new Error(
      'Encabezados no reconocidos. Se esperan columnas: Codigo, Nombre, Estanteria, Estante.',
    )
  }

  // Mapas para reusar posiciones/colores de lo existente
  const prevShelfByName = new Map(existingShelves.map((s) => [s.name, s]))
  const prevColorByCode = new Map()
  existingShelves.forEach((s) =>
    s.levels.forEach((l) => l.products.forEach((p) => prevColorByCode.set(p.code, p.color))),
  )

  const shelfMap = new Map() // name -> shelf
  const seenCodes = new Set()
  let autoX = 90
  let autoY = 90

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r]
    const code = (cells[idxCode] || '').trim()
    const name = (cells[idxName] || '').trim()
    const shelfName = (cells[idxShelf] || '').trim()
    const levelLabel = (cells[idxLevel] || '').trim() || 'Estante 1'
    if (!code || !shelfName) continue

    if (seenCodes.has(code)) {
      throw new Error(`Código duplicado en el CSV: "${code}". Los códigos deben ser únicos.`)
    }
    seenCodes.add(code)

    if (!shelfMap.has(shelfName)) {
      const prev = prevShelfByName.get(shelfName)
      shelfMap.set(shelfName, {
        id: uid('shelf'),
        name: shelfName,
        x: prev ? prev.x : autoX,
        y: prev ? prev.y : autoY,
        levels: [],
      })
      if (!prev) {
        autoX += 290
        if (autoX > 800) {
          autoX = 90
          autoY += 230
        }
      }
    }
    const shelf = shelfMap.get(shelfName)
    let level = shelf.levels.find((l) => l.label === levelLabel)
    if (!level) {
      level = { id: uid('lvl'), label: levelLabel, products: [] }
      shelf.levels.push(level)
    }
    level.products.push({
      id: uid('p'),
      name: name || code,
      code,
      color: prevColorByCode.get(code) || randomColor(),
    })
  }

  const shelves = Array.from(shelfMap.values())
  if (shelves.length === 0) {
    throw new Error('No se pudo importar ninguna estantería válida.')
  }
  return { shelves: migratePositions(shelves) }
}

// ---------- JSON ----------

export function exportJSON(state) {
  const payload = {
    app: 'depo-inventario',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: state,
  }
  downloadFile(`inventario_backup_${stamp()}.json`, JSON.stringify(payload, null, 2), 'application/json')
}

// Valida y normaliza un JSON importado. Devuelve { shelves }.
export function importJSON(text) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('El archivo no es un JSON válido.')
  }
  const data = parsed && parsed.data ? parsed.data : parsed
  if (!data || !Array.isArray(data.shelves)) {
    throw new Error('Estructura JSON no reconocida (falta "shelves").')
  }

  // Normalización defensiva
  const seenCodes = new Set()
  const shelves = data.shelves.map((s, i) => ({
    id: s.id || uid('shelf'),
    name: s.name || `Estantería ${i + 1}`,
    x: Number.isFinite(s.x) ? s.x : 90 + i * 60,
    y: Number.isFinite(s.y) ? s.y : 90 + i * 40,
    levels: Array.isArray(s.levels)
      ? s.levels.map((l, j) => ({
          id: l.id || uid('lvl'),
          label: l.label || `Estante ${j + 1}`,
          products: Array.isArray(l.products)
            ? l.products.map((p) => {
                const code = String(p.code || uid('COD')).trim()
                if (seenCodes.has(code)) {
                  throw new Error(`Código duplicado en el JSON: "${code}".`)
                }
                seenCodes.add(code)
                return {
                  id: p.id || uid('p'),
                  name: p.name || code,
                  code,
                  color: p.color || randomColor(),
                  ...(Number.isInteger(p.col) ? { col: p.col } : {}),
                  ...(Number.isInteger(p.depth) ? { depth: p.depth } : {}),
                  ...(Number.isInteger(p.tier) ? { tier: p.tier } : {}),
                }
              })
            : [],
        }))
      : [],
  }))

  return { shelves: migratePositions(shelves) }
}
