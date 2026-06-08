import { useState } from 'react'
import { useInventory } from '../context/InventoryContext'
import { IconPlus, IconEdit, IconTrash, IconMove, IconBox, IconLayers } from './Icons'
import ProductModal from './ProductModal'
import MoveProductModal from './MoveProductModal'

export default function PanelLateral({ shelf, mode, highlightId, onHighlight, onConfigShelf }) {
  const { deleteProduct } = useInventory()
  const isEditor = mode === 'editor'
  const [productModal, setProductModal] = useState(null) // {mode, product?, target?}
  const [moveTarget, setMoveTarget] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  const total = shelf.levels.reduce((a, l) => a + l.products.length, 0)

  return (
    <aside className="flex h-full w-full flex-col border-l border-ink-700 bg-ink-900/80 backdrop-blur">
      {/* Encabezado */}
      <div className="border-b border-ink-700 px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-bold tracking-display text-white">{shelf.name}</h2>
            <p className="mt-0.5 flex items-center gap-3 text-xs text-ink-600">
              <span className="flex items-center gap-1">
                <IconLayers width={12} height={12} /> {shelf.levels.length} estantes
              </span>
              <span className="flex items-center gap-1">
                <IconBox width={12} height={12} /> {total} productos
              </span>
            </p>
          </div>
          {isEditor && (
            <button
              onClick={onConfigShelf}
              title="Configurar estantes"
              className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg border border-ink-700 bg-ink-800 text-ink-100 transition hover:bg-ink-700"
            >
              <IconEdit width={15} height={15} />
            </button>
          )}
        </div>
      </div>

      {/* Lista por estante */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {shelf.levels.map((lvl) => (
          <div key={lvl.id} className="mb-4">
            <div className="mb-1.5 flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-600">{lvl.label}</span>
              {isEditor && (
                <button
                  onClick={() =>
                    setProductModal({
                      mode: 'create',
                      target: { shelfId: shelf.id, levelId: lvl.id, shelfName: shelf.name, levelLabel: lvl.label },
                    })
                  }
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-editor transition hover:bg-editor/10"
                >
                  <IconPlus width={12} height={12} /> Agregar
                </button>
              )}
            </div>

            {lvl.products.length === 0 ? (
              <p className="px-2 py-2 text-xs italic text-ink-600/70">Estante vacío</p>
            ) : (
              <ul className="space-y-1">
                {lvl.products.map((p) => {
                  const active = p.id === highlightId
                  return (
                    <li key={p.id}>
                      <div
                        onClick={() => onHighlight(p.id)}
                        className={`group flex cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 transition ${
                          active
                            ? 'border-editor/60 bg-editor/10'
                            : 'border-transparent bg-ink-850 hover:border-ink-700 hover:bg-ink-800'
                        }`}
                      >
                        <span
                          className="h-6 w-6 flex-shrink-0 rounded-md border border-white/10"
                          style={{ backgroundColor: p.color, boxShadow: active ? `0 0 10px ${p.color}` : 'none' }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-white">{p.name}</span>
                          <span className="block truncate font-mono text-[11px] text-ink-600">{p.code}</span>
                        </span>
                        {isEditor && (
                          <span className="flex flex-shrink-0 gap-0.5 opacity-0 transition group-hover:opacity-100">
                            <MiniBtn
                              title="Editar"
                              onClick={(e) => {
                                e.stopPropagation()
                                setProductModal({ mode: 'edit', product: p })
                              }}
                            >
                              <IconEdit width={13} height={13} />
                            </MiniBtn>
                            <MiniBtn
                              title="Mover"
                              onClick={(e) => {
                                e.stopPropagation()
                                setMoveTarget({ ...p, shelfId: shelf.id })
                              }}
                            >
                              <IconMove width={13} height={13} />
                            </MiniBtn>
                            <MiniBtn
                              title="Eliminar"
                              danger
                              onClick={(e) => {
                                e.stopPropagation()
                                setConfirmDel(p)
                              }}
                            >
                              <IconTrash width={13} height={13} />
                            </MiniBtn>
                          </span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Pie con leyenda de controles */}
      <div className="border-t border-ink-700 px-4 py-2.5 text-[11px] text-ink-600">
        {isEditor
          ? 'Clic en un producto para resaltarlo en 3D'
          : 'Vista de solo lectura · clic para resaltar en 3D'}
      </div>

      {/* Modales */}
      <ProductModal
        open={!!productModal}
        onClose={() => setProductModal(null)}
        mode={productModal?.mode}
        product={productModal?.product}
        target={productModal?.target}
      />
      <MoveProductModal open={!!moveTarget} onClose={() => setMoveTarget(null)} product={moveTarget} />

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmDel(null)} />
          <div className="relative w-full max-w-sm animate-scale-in rounded-2xl border border-red-500/30 bg-ink-850 p-6">
            <h3 className="font-display text-lg font-semibold text-white">¿Eliminar producto?</h3>
            <p className="mt-2 text-sm text-ink-600">
              Se eliminará <span className="text-white">{confirmDel.name}</span> ({confirmDel.code}).
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
                  deleteProduct(confirmDel.id)
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
    </aside>
  )
}

function MiniBtn({ children, title, danger, onClick }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`grid h-7 w-7 place-items-center rounded-md transition ${
        danger ? 'text-ink-600 hover:bg-red-500/15 hover:text-red-400' : 'text-ink-600 hover:bg-ink-700 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
