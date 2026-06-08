import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { uid, randomColor, seedData } from '../lib/utils'
import { nextFreeSlot, assignPositions, dropSlot, gravityPack, GRID, migratePositions } from '../lib/grid'

const STORAGE_KEY = 'depo-inventario:v1'
const API_URL = '/api/inventario' // función serverless en Vercel
const POLL_MS = 8000 // cada cuánto refresca para ver cambios de otros
const EDIT_PAUSE_MS = 15000 // tras editar, se pausa el refresco para no pisar cambios propios

const InventoryContext = createContext(null)

export function useInventory() {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error('useInventory debe usarse dentro de <InventoryProvider>')
  return ctx
}

// Carga sincrónica desde localStorage (respaldo) para tener datos al instante.
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

// Contraseña de escritura opcional (si configurás WRITE_PASSWORD en Vercel).
function writePassword() {
  try {
    return localStorage.getItem('depo-write-password') || ''
  } catch {
    return ''
  }
}

export function InventoryProvider({ children }) {
  const [state, setState] = useState(loadInitial)
  const applyingRemote = useRef(false) // el cambio viene del servidor (no re-guardar)
  const lastEditAt = useRef(0) // última edición local (para pausar el refresco)
  const remoteSig = useRef('') // firma del último dato remoto aplicado
  const saveTimer = useRef(null)
  const firstSave = useRef(true)

  // Aplica datos venidos del servidor (evita re-render si no cambió nada).
  const applyRemote = useCallback((data) => {
    const next = { shelves: migratePositions(data.shelves) }
    const sig = JSON.stringify(next)
    if (sig === remoteSig.current) return
    remoteSig.current = sig
    applyingRemote.current = true
    setState(next)
  }, [])

  // Carga inicial desde el servidor (si la API está disponible)
  useEffect(() => {
    let cancelled = false
    fetch(API_URL)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('no api'))))
      .then((d) => {
        if (!cancelled && d && Array.isArray(d.shelves) && d.shelves.length) applyRemote(d)
      })
      .catch(() => {
        /* sin backend (p. ej. dev local): se usa el respaldo de localStorage */
      })
    return () => {
      cancelled = true
    }
  }, [applyRemote])

  // Refresco periódico: los invitados ven los cambios del admin sin recargar.
  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() - lastEditAt.current < EDIT_PAUSE_MS) return // hay edición reciente
      fetch(API_URL)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('no api'))))
        .then((d) => {
          if (d && Array.isArray(d.shelves)) applyRemote(d)
        })
        .catch(() => {})
    }, POLL_MS)
    return () => clearInterval(id)
  }, [applyRemote])

  // Persistencia: localStorage siempre (cache) + servidor cuando es edición local.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage no disponible */
    }

    if (firstSave.current) {
      firstSave.current = false
      remoteSig.current = JSON.stringify(state)
      return // no guardar en el servidor en el primer render
    }
    if (applyingRemote.current) {
      applyingRemote.current = false
      return // el cambio vino del servidor, no reenviar
    }

    // Edición local -> guardar en el servidor (con debounce)
    lastEditAt.current = Date.now()
    remoteSig.current = JSON.stringify(state)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-write-password': writePassword() },
        body: JSON.stringify({ shelves: state.shelves }),
      }).catch(() => {})
    }, 500)
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
