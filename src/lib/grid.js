// Grilla de casilleros dentro de cada estante.
// col   -> posición a lo ancho (eje X)
// depth -> posición en profundidad, 0 = adelante (eje Z)
// tier  -> altura de apilado, 0 = apoyado en el estante (eje Y)
//
// Reglas:
// - Una "columna" es un par (col, depth). Apila hasta GRID.tiers cubos.
// - Gravedad: los tiers de una columna son siempre 0,1,2,... sin huecos.
//   Un cubo nunca queda flotando: si no tiene otro debajo, baja al estante.
export const GRID = { cols: 5, depths: 3, tiers: 2 }

export function countColumn(products, col, depth, exceptId = null) {
  return products.filter((p) => p.id !== exceptId && p.col === col && p.depth === depth).length
}

// Reacomoda una columna para que sus tiers sean contiguos desde 0 (aplica gravedad).
export function gravityPack(products) {
  const groups = new Map()
  products.forEach((p) => {
    const k = `${p.col}|${p.depth}`
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k).push(p)
  })
  const tierOf = new Map()
  groups.forEach((arr) => {
    arr
      .slice()
      .sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0))
      .forEach((p, i) => tierOf.set(p.id, i))
  })
  return products.map((p) => ({ ...p, tier: tierOf.has(p.id) ? tierOf.get(p.id) : p.tier }))
}

// Casillero donde caería un cubo soltado sobre (col, depth):
// se apila encima de esa columna; si está al tope, busca otra columna con lugar.
// Devuelve {col, depth, tier} o null si el estante está completamente lleno.
export function dropSlot(products, col, depth, exceptId = null) {
  const h = countColumn(products, col, depth, exceptId)
  if (h < GRID.tiers) return { col, depth, tier: h }
  for (let d = 0; d < GRID.depths; d++) {
    for (let c = 0; c < GRID.cols; c++) {
      if (c === col && d === depth) continue
      const hh = countColumn(products, c, d, exceptId)
      if (hh < GRID.tiers) return { col: c, depth: d, tier: hh }
    }
  }
  return null
}

// Próximo casillero libre para un producto nuevo:
// llena primero el piso (tier 0) en todas las columnas, luego apila.
export function nextFreeSlot(products) {
  for (let tier = 0; tier < GRID.tiers; tier++) {
    for (let depth = 0; depth < GRID.depths; depth++) {
      for (let col = 0; col < GRID.cols; col++) {
        if (countColumn(products, col, depth) === tier) return { col, depth, tier }
      }
    }
  }
  return { col: 0, depth: 0, tier: GRID.tiers } // overflow (estante lleno, caso raro)
}

// Garantiza que todos los productos tengan posición válida y aplica gravedad.
export function assignPositions(products) {
  const result = []
  products.forEach((p) => {
    if (Number.isInteger(p.col) && Number.isInteger(p.depth) && Number.isInteger(p.tier)) {
      result.push(p)
    } else {
      result.push({ ...p, ...nextFreeSlot(result) })
    }
  })
  return gravityPack(result)
}

export function migratePositions(shelves) {
  return shelves.map((sh) => ({
    ...sh,
    levels: sh.levels.map((l) => ({ ...l, products: assignPositions(l.products) })),
  }))
}
