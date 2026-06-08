import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { uid, randomColor, seedData } from '../lib/utils'
import { nextFreeSlot, assignPositions, dropSlot, gravityPack, GRID, migratePositions } from '../lib/grid'

const STORAGE_KEY = 'depo-inventario:v1'

const InventoryContext = createContext(null)

export function useInventory() {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error('useInventory debe usarse dentro de <InventoryProvider>')
  return ctx
}

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.shelves)) {
        return { shelves: migratePositions(parsed.shelves) }
      }
    }
  } catch {
    /* ignora errores de parseo y arranca con seed */
  }
  return seedData()
}

export function InventoryProvider({ children }) {
  const [state, setState] = useState(loadInitial)
  const firstRender = useRef(true)

  // Persistencia en localStorage
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage lleno o no disponible */
    }
  }, [state])

  // ---------- Consultas ----------

  const allProducts = useCallback(() => {
    const out = []
    state.shelves.forEach((shelf) => {
      shelf.levels.forEach((level) => {
        level.products.forEach((p) => {
          out.push({ ...p, shelfId: shelf.id, shelfName: shelf.name, levelId: level.id, levelLabel: level.label })
        })
      })
    })
    return out
  }, [state])

  const codeExists = useCallback(
    (code, ignoreProductId = null) => {
      const c = code.trim().toLowerCase()
      return state.shelves.some((shelf) =>
        shelf.levels.some((level) =>
          level.products.some((p) => p.id !== ignoreProductId && p.code.trim().toLowerCase() === c),
        ),
      )
    },
    [state],
  )

  // ---------- Estanterías ----------

  const addShelf = useCallback((x = 120, y = 120) => {
    const id = uid('shelf')
    setState((s) => ({
      ...s,
      shelves: [
        ...s.shelves,
        {
          id,
          name: `Estantería ${String.fromCharCode(65 + (s.shelves.length % 26))}${
            s.shelves.length >= 26 ? Math.floor(s.shelves.length / 26) : ''
          }`,
          x,
          y,
          levels: [
            { id: uid('lvl'), label: 'Estante 1', products: [] },
            { id: uid('lvl'), label: 'Estante 2', products: [] },
          ],
        },
      ],
    }))
    return id
  }, [])

  const renameShelf = useCallback((shelfId, name) => {
    setState((s) => ({
      ...s,
      shelves: s.shelves.map((sh) => (sh.id === shelfId ? { ...sh, name } : sh)),
    }))
  }, [])

  const moveShelf = useCallback((shelfId, x, y) => {
    setState((s) => ({
      ...s,
      shelves: s.shelves.map((sh) => (sh.id === shelfId ? { ...sh, x, y } : sh)),
    }))
  }, [])

  const deleteShelf = useCallback((shelfId) => {
    setState((s) => ({ ...s, shelves: s.shelves.filter((sh) => sh.id !== shelfId) }))
  }, [])

  // ---------- Estantes (niveles) ----------

  // Ajusta la cantidad de estantes de una estantería (agrega vacíos o quita los del final).
  const setLevelCount = useCallback((shelfId, count) => {
    setState((s) => ({
      ...s,
      shelves: s.shelves.map((sh) => {
        if (sh.id !== shelfId) return sh
        const current = sh.levels
        if (count === current.length) return sh
        if (count > current.length) {
          const extra = []
          for (let i = current.length; i < count; i++) {
            extra.push({ id: uid('lvl'), label: `Estante ${i + 1}`, products: [] })
          }
          return { ...sh, levels: [...current, ...extra] }
        }
        // reducir: conserva los primeros y vuelca los productos sobrantes al último que queda
        const kept = current.slice(0, count)
        const removed = current.slice(count)
        const overflow = removed.flatMap((l) => l.products)
        if (overflow.length && kept.length) {
          const last = kept[kept.length - 1]
          kept[kept.length - 1] = {
            ...last,
            products: assignPositions([...last.products, ...overflow.map((p) => ({ ...p, col: undefined, depth: undefined, tier: undefined }))]),
          }
        }
        return { ...sh, levels: kept }
      }),
    }))
  }, [])

  const renameLevel = useCallback((shelfId, levelId, label) => {
    setState((s) => ({
      ...s,
      shelves: s.shelves.map((sh) =>
        sh.id !== shelfId
          ? sh
          : { ...sh, levels: sh.levels.map((l) => (l.id === levelId ? { ...l, label } : l)) },
      ),
    }))
  }, [])

  // ---------- Productos ----------

  const addProduct = useCallback((shelfId, levelId, { name, code, color }) => {
    setState((s) => ({
      ...s,
      shelves: s.shelves.map((sh) =>
        sh.id !== shelfId
          ? sh
          : {
              ...sh,
              levels: sh.levels.map((l) =>
                l.id !== levelId
                  ? l
                  : {
                      ...l,
                      products: [
                        ...l.products,
                        {
                          id: uid('p'),
                          name: name.trim(),
                          code: code.trim(),
                          color: color || randomColor(),
                          ...nextFreeSlot(l.products),
                        },
                      ],
                    },
              ),
            },
      ),
    }))
  }, [])

  const updateProduct = useCallback((productId, { name, code, color }) => {
    setState((s) => ({
      ...s,
      shelves: s.shelves.map((sh) => ({
        ...sh,
        levels: sh.levels.map((l) => ({
          ...l,
          products: l.products.map((p) =>
            p.id === productId
              ? { ...p, name: name.trim(), code: code.trim(), color: color || p.color }
              : p,
          ),
        })),
      })),
    }))
  }, [])

  const deleteProduct = useCallback((productId) => {
    setState((s) => ({
      ...s,
      shelves: s.shelves.map((sh) => ({
        ...sh,
        levels: sh.levels.map((l) => {
          const had = l.products.some((p) => p.id === productId)
          const products = l.products.filter((p) => p.id !== productId)
          return { ...l, products: had ? gravityPack(products) : products }
        }),
      })),
    }))
  }, [])

  // Mueve un producto a otra estantería/estante (lo apila en una columna con lugar).
  const moveProduct = useCallback((productId, destShelfId, destLevelId) => {
    setState((s) => {
      let moving = null
      const stripped = s.shelves.map((sh) => ({
        ...sh,
        levels: sh.levels.map((l) => {
          const f = l.products.find((p) => p.id === productId)
          if (f) moving = f
          return { ...l, products: gravityPack(l.products.filter((p) => p.id !== productId)) }
        }),
      }))
      if (!moving) return s
      let destProducts = []
      stripped.forEach((sh) => sh.levels.forEach((l) => (l.id === destLevelId ? (destProducts = l.products) : null)))
      const slot = dropSlot(destProducts, 0, 0) || { col: 0, depth: 0, tier: GRID.tiers }
      return {
        ...s,
        shelves: stripped.map((sh) => ({
          ...sh,
          levels: sh.levels.map((l) =>
            l.id !== destLevelId ? l : { ...l, products: gravityPack([...l.products, { ...moving, ...slot }]) },
          ),
        })),
      }
    })
  }, [])

  // Coloca un producto soltándolo (drag 3D) en una columna del estante destino.
  // Se apila ENCIMA de los cubos existentes (no reemplaza). Si la columna está al
  // tope, dropSlot ya eligió otra columna libre. Luego se aplica gravedad.
  const placeProduct = useCallback((productId, destLevelId, requested) => {
    setState((s) => {
      let moving = null
      let sourceLevelId = null
      s.shelves.forEach((sh) =>
        sh.levels.forEach((l) => {
          const f = l.products.find((p) => p.id === productId)
          if (f) {
            moving = f
            sourceLevelId = l.id
          }
        }),
      )
      if (!moving) return s

      let destProducts = []
      s.shelves.forEach((sh) => sh.levels.forEach((l) => (l.id === destLevelId ? (destProducts = l.products) : null)))

      const slot = dropSlot(destProducts, requested.col, requested.depth, productId)
      if (!slot) return s // estante destino completamente lleno -> no hace nada

      const shelves = s.shelves.map((sh) => ({
        ...sh,
        levels: sh.levels.map((l) => {
          if (sourceLevelId === destLevelId && l.id === destLevelId) {
            const others = l.products.filter((p) => p.id !== productId)
            return { ...l, products: gravityPack([...others, { ...moving, ...slot }]) }
          }
          if (l.id === sourceLevelId) {
            return { ...l, products: gravityPack(l.products.filter((p) => p.id !== productId)) }
          }
          if (l.id === destLevelId) {
            return { ...l, products: gravityPack([...l.products, { ...moving, ...slot }]) }
          }
          return l
        }),
      }))

      return { ...s, shelves }
    })
  }, [])

  // ---------- Reemplazo total (import) / reset ----------

  const replaceAll = useCallback((next) => {
    setState({ shelves: next.shelves })
  }, [])

  const resetAll = useCallback(() => {
    setState(seedData())
  }, [])

  const clearAll = useCallback(() => {
    setState({ shelves: [] })
  }, [])

  const value = {
    state,
    shelves: state.shelves,
    allProducts,
    codeExists,
    addShelf,
    renameShelf,
    moveShelf,
    deleteShelf,
    setLevelCount,
    renameLevel,
    addProduct,
    updateProduct,
    deleteProduct,
    moveProduct,
    placeProduct,
    replaceAll,
    resetAll,
    clearAll,
  }

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}
