import { useRef, useState, useEffect, useCallback } from 'react'
import { useInventory } from '../context/InventoryContext'
import { IconPlus, IconEdit, IconTrash, IconBox, IconMove } from './Icons'
import ShelfConfigModal from './ShelfConfigModal'

const SHELF_W = 248
const SHELF_H = 220

export default function Plano2D({ mode, onOpenShelf, highlightShelfId }) {
  const { shelves, addShelf, moveShelf, deleteShelf } = useInventory()
  const planeRef = useRef(null)
  const [dragId, setDragId] = useState(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const dragStart = useRef({ x: 0, y: 0 })
  const didDrag = useRef(false)
  const [configShelf, setConfigShelf] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const isEditor = mode === 'editor'

  // Scroll automático hacia la estantería resaltada por la búsqueda
  useEffect(() => {
    if (!highlightShelfId || !planeRef.current) return
    const el = planeRef.current.querySelector(`[data-shelf="${highlightShelfId}"]`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
  }, [highlightShelfId])

  const onPointerDown = useCallback(
    (e, shelf) => {
      if (!isEditor) return
      e.stopPropagation()
      const planeRect = planeRef.current.getBoundingClientRect()
      dragOffset.current = {
        x: e.clientX - (planeRect.left + shelf.x),
        y: e.clientY - (planeRect.top + shelf.y),
      }
      dragStart.current = { x: e.clientX, y: e.clientY }
      didDrag.current = false
      setDragId(shelf.id)
      e.currentTarget.setPointerCapture?.(e.pointerId)
    },
    [isEditor],
  )

  const onPointerMove = useCallback(
    (e) => {
      if (!dragId) return
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDrag.current = true
      const planeRect = planeRef.current.getBoundingClientRect()
      let x = e.clientX - planeRect.left - dragOffset.current.x
      let y = e.clientY - planeRect.top - dragOffset.current.y
      x = Math.max(0, Math.min(x, planeRef.current.scrollWidth - SHELF_W))
      y = Math.max(0, Math.min(y, planeRef.current.scrollHeight - SHELF_H))
      moveShelf(dragId, Math.round(x), Math.round(y))
    },
    [dragId, moveShelf],
  )

  const endDrag = useCallback(() => setDragId(null), [])

  return (
    <div className="relative h-full w-full">
      <div
        ref={planeRef}
        className="blueprint-grid relative h-full w-full overflow-auto"
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        {/* Lienzo grande para mover libremente */}
        <div className="relative" style={{ width: 2000, height: 1400, minWidth: '100%', minHeight: '100%' }}>
          {shelves.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center text-ink-600">
                <IconBox width={40} height={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">
                  {isEditor ? 'No hay estanterías. Usá “Agregar estantería”.' : 'No hay estanterías para mostrar.'}
                </p>
              </div>
            </div>
          )}

          {shelves.map((shelf) => {
            const count = shelf.levels.reduce((a, l) => a + l.products.length, 0)
            const highlighted = shelf.id === highlightShelfId
            const dragging = shelf.id === dragId
            return (
              <div
                key={shelf.id}
                data-shelf={shelf.id}
                className={`group absolute select-none rounded-xl border-2 transition-shadow ${
                  highlighted ? 'border-editor animate-pulse-ring' : 'border-ink-600'
                } ${dragging ? 'z-30 shadow-2xl' : 'z-10'}`}
                style={{
                  left: shelf.x,
                  top: shelf.y,
                  width: SHELF_W,
                  height: SHELF_H,
                  background:
                    'linear-gradient(160deg, rgba(37,43,58,0.95), rgba(20,24,33,0.95))',
                  cursor: isEditor ? (dragging ? 'grabbing' : 'grab') : 'pointer',
                }}
                onPointerDown={(e) => onPointerDown(e, shelf)}
                onClick={(e) => {
                  // Evita abrir 3D si se acaba de arrastrar
                  if (didDrag.current) {
                    didDrag.current = false
                    return
                  }
                  if (!isEditor || e.target.closest('[data-noopen]') == null) {
                    onOpenShelf(shelf.id)
                  }
                }}
              >
                {/* Encabezado */}
                <div className="flex items-center justify-between border-b border-ink-700/70 px-3 py-2">
                  <span className="truncate font-display text-sm font-semibold tracking-display text-white">
                    {shelf.name}
                  </span>
                  {isEditor && (
                    <span className="text-ink-600">
                      <IconMove width={14} height={14} />
                    </span>
                  )}
                </div>

                {/* Contenido: lista por estante (Estante 1 arriba) */}
                <div className="flex flex-col gap-1.5 overflow-y-auto px-3 py-2" style={{ height: SHELF_H - 74 }}>
                  {shelf.levels.length === 0 && (
                    <span className="text-[11px] italic text-ink-600">Sin estantes</span>
                  )}
                  {shelf.levels.map((lvl, li) => (
                    <div key={lvl.id} className="rounded-md bg-ink-900/50 px-2 py-1">
                      <div className="mb-0.5 flex items-center justify-between">
                        <span className="truncate text-[10px] font-medium uppercase tracking-wide text-ink-600">
                          <span className="text-ink-100">{li + 1}.</span> {lvl.label}
                        </span>
                        <span className="text-[10px] text-ink-600">{lvl.products.length}</span>
                      </div>
                      {lvl.products.length === 0 ? (
                        <span className="text-[10px] italic text-ink-600/60">vacío</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {lvl.products.map((p) => (
                            <span
                              key={p.id}
                              title={`${p.name} · ${p.code}`}
                              className="inline-flex items-center gap-1 rounded bg-ink-800 px-1.5 py-0.5 text-[10px] text-ink-100"
                            >
                              <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: p.color }} />
                              <span className="font-mono">{p.code}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pie con conteo */}
                <div className="flex items-center justify-between border-t border-ink-700/70 px-3 py-1.5 text-[11px] text-ink-600">
                  <span>{shelf.levels.length} estantes</span>
                  <span className="flex items-center gap-1">
                    <IconBox width={11} height={11} /> {count}
                  </span>
                </div>

                {/* Controles de edición (solo Editor, aparecen en hover) */}
                {isEditor && (
                  <div
                    data-noopen
                    className="absolute -top-3 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <CtrlBtn title="Configurar" onClick={() => setConfigShelf(shelf)}>
                      <IconEdit width={13} height={13} />
                    </CtrlBtn>
                    <CtrlBtn title="Eliminar" danger onClick={() => setConfirmDel(shelf)}>
                      <IconTrash width={13} height={13} />
                    </CtrlBtn>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Botón flotante agregar estantería (solo Editor) */}
      {isEditor && (
        <button
          onClick={() => {
            const sc = planeRef.current
            const x = (sc?.scrollLeft || 0) + 80
            const y = (sc?.scrollTop || 0) + 80
            const id = addShelf(x, y)
            setTimeout(() => {
              const el = sc?.querySelector(`[data-shelf="${id}"]`)
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 50)
          }}
          className="absolute bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-editor px-5 py-3 font-semibold text-ink-950 shadow-lg shadow-editor/30 transition hover:brightness-110 active:scale-95"
        >
          <IconPlus width={18} height={18} /> Agregar estantería
        </button>
      )}

      <ShelfConfigModal open={!!configShelf} onClose={() => setConfigShelf(null)} shelf={configShelf} />

      {/* Confirmación de borrado */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmDel(null)} />
          <div className="relative w-full max-w-sm animate-scale-in rounded-2xl border border-red-500/30 bg-ink-850 p-6">
            <h3 className="font-display text-lg font-semibold text-white">¿Eliminar “{confirmDel.name}”?</h3>
            <p className="mt-2 text-sm text-ink-600">
              Se eliminará la estantería y todos sus productos. Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDel(null)}
                className="rounded-lg border border-ink-700 bg-ink-800 px-4 py-2 text-sm text-ink-100 hover:bg-ink-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteShelf(confirmDel.id)
                  setConfirmDel(null)
                }}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CtrlBtn({ children, title, danger, onClick }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`grid h-7 w-7 place-items-center rounded-lg border shadow-md transition ${
        danger
          ? 'border-red-500/40 bg-ink-850 text-red-400 hover:bg-red-500/20'
          : 'border-ink-600 bg-ink-850 text-ink-100 hover:bg-ink-700'
      }`}
    >
      {children}
    </button>
  )
}
