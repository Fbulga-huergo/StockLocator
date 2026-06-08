import { useState, Suspense, useEffect } from 'react'
import { useInventory } from '../context/InventoryContext'
import Estanteria3D from '../three/Estanteria3D'
import PanelLateral from './PanelLateral'
import ShelfConfigModal from './ShelfConfigModal'
import { IconBack, IconLayers } from './Icons'

function Loader() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-ink-950">
      <div className="flex flex-col items-center gap-3 text-ink-600">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-700 border-t-editor" />
        <span className="text-sm">Cargando vista 3D…</span>
      </div>
    </div>
  )
}

export default function Vista3D({ shelf, mode, onBack, initialHighlight }) {
  const { placeProduct } = useInventory()
  const [highlightId, setHighlightId] = useState(initialHighlight || null)
  const [configOpen, setConfigOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    setHighlightId(initialHighlight || null)
  }, [initialHighlight, shelf.id])

  const accent = mode === 'editor' ? '#f59e0b' : '#60a5fa'

  return (
    <div className="relative flex h-full w-full flex-col">
      {/* Barra superior */}
      <div className="z-20 flex items-center justify-between gap-3 border-b border-ink-700 bg-ink-900/90 px-3 py-2.5 backdrop-blur">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-800 px-3 py-1.5 text-sm text-ink-100 transition hover:bg-ink-700"
        >
          <IconBack width={16} height={16} /> Volver al plano
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <span className="hidden truncate font-display text-sm font-semibold text-white sm:block">{shelf.name}</span>
          <button
            onClick={() => setPanelOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-800 px-3 py-1.5 text-sm text-ink-100 transition hover:bg-ink-700 lg:hidden"
          >
            <IconLayers width={15} height={15} /> {panelOpen ? 'Ocultar' : 'Productos'}
          </button>
        </div>
      </div>

      {/* Cuerpo: canvas + panel */}
      <div className="relative flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <Suspense fallback={<Loader />}>
            <Estanteria3D
              shelf={shelf}
              mode={mode}
              highlightId={highlightId}
              onCubeClick={(p) => setHighlightId((cur) => (cur === p.id ? null : p.id))}
              onPlace={placeProduct}
              onDraggingChange={setDragging}
            />
          </Suspense>

          {/* Ayuda de controles de cámara */}
          <div className="pointer-events-none absolute bottom-3 left-3 hidden rounded-lg border border-ink-700 bg-ink-900/80 px-3 py-2 text-[11px] leading-relaxed text-ink-600 backdrop-blur sm:block">
            <div>
              <span className="text-ink-100">Clic izq.</span> rotar ·{' '}
              <span className="text-ink-100">rueda</span> zoom ·{' '}
              <span className="text-ink-100">clic der.</span> desplazar
            </div>
            {mode === 'editor' ? (
              <div>
                <span style={{ color: '#f59e0b' }}>Arrastrá un cubo</span> para reubicarlo (ancho, alto y fondo).
              </div>
            ) : (
              <div>Pasá el cursor sobre un cubo para ver nombre y código.</div>
            )}
          </div>

          {dragging && (
            <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-editor/40 bg-editor/15 px-3 py-1 text-xs font-medium text-editor-soft">
              Soltá sobre el casillero deseado
            </div>
          )}
        </div>

        {/* Panel lateral: fijo en desktop, deslizable en mobile */}
        <div
          className={`absolute inset-y-0 right-0 z-10 w-80 max-w-[85vw] transform transition-transform duration-300 lg:static lg:translate-x-0 ${
            panelOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <PanelLateral
            shelf={shelf}
            mode={mode}
            highlightId={highlightId}
            onHighlight={(id) => setHighlightId((cur) => (cur === id ? null : id))}
            onConfigShelf={() => setConfigOpen(true)}
          />
        </div>
      </div>

      <ShelfConfigModal open={configOpen} onClose={() => setConfigOpen(false)} shelf={shelf} />
    </div>
  )
}
