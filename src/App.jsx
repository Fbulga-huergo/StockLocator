import { useState, useCallback, useEffect } from 'react'
import { useInventory } from './context/InventoryContext'
import HomeScreen from './components/HomeScreen'
import Plano2D from './components/Plano2D'
import ListaInventario from './components/ListaInventario'
import Vista3D from './components/Vista3D'
import Buscador from './components/Buscador'
import ImportExportMenu from './components/ImportExportMenu'
import { IconHome, IconEdit, IconEye, IconShelf } from './components/Icons'

export default function App() {
  const { shelves } = useInventory()
  const [mode, setMode] = useState(null) // null | 'editor' | 'guest'
  const [view, setView] = useState('2d') // '2d' | '3d'
  const [mapView, setMapView] = useState('plano') // 'plano' | 'lista'
  const [selectedShelfId, setSelectedShelfId] = useState(null)
  const [highlightShelfId, setHighlightShelfId] = useState(null)
  const [productHighlight, setProductHighlight] = useState(null)

  const accent = mode === 'editor' ? '#f59e0b' : '#60a5fa'
  const selectedShelf = shelves.find((s) => s.id === selectedShelfId)

  // Si la estantería seleccionada fue eliminada estando en 3D, volver al plano
  useEffect(() => {
    if (view === '3d' && selectedShelfId && !selectedShelf) {
      setView('2d')
      setSelectedShelfId(null)
    }
  }, [view, selectedShelfId, selectedShelf])

  const goHome = useCallback(() => {
    setMode(null)
    setView('2d')
    setSelectedShelfId(null)
    setHighlightShelfId(null)
    setProductHighlight(null)
  }, [])

  const openShelf = useCallback((shelfId, highlightProductId = null) => {
    setSelectedShelfId(shelfId)
    setProductHighlight(highlightProductId)
    setView('3d')
  }, [])

  // Selección desde el buscador: resalta en 2D y abre 3D con el cubo resaltado
  const handleSearchSelect = useCallback(
    (product) => {
      setHighlightShelfId(product.shelfId)
      openShelf(product.shelfId, product.id)
    },
    [openShelf],
  )

  const backTo2D = useCallback(() => {
    setView('2d')
    setProductHighlight(null)
  }, [])

  if (!mode) {
    return <HomeScreen onSelectMode={setMode} />
  }

  return (
    <div className="flex h-full w-full flex-col bg-ink-950">
      {/* ---- Barra superior global ---- */}
      <header className="z-30 flex items-center gap-3 border-b border-ink-700 bg-ink-900/95 px-3 py-2.5 backdrop-blur sm:px-4">
        {/* Marca + modo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className="grid h-8 w-8 place-items-center rounded-lg"
              style={{ backgroundColor: `${accent}1a`, color: accent }}
            >
              <IconShelf width={17} height={17} />
            </span>
            <span className="hidden font-display text-base font-bold tracking-display text-white md:block">
              Depósito
            </span>
          </div>

          <ModeBadge mode={mode} />

          {view === '2d' && (
            <div className="ml-1 hidden items-center rounded-lg border border-ink-700 bg-ink-850 p-0.5 sm:flex">
              {['plano', 'lista'].map((v) => (
                <button
                  key={v}
                  onClick={() => setMapView(v)}
                  className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition ${
                    mapView === v ? 'text-ink-950' : 'text-ink-100 hover:text-white'
                  }`}
                  style={mapView === v ? { backgroundColor: accent } : {}}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buscador (centro) */}
        <div className="flex flex-1 justify-center px-2">
          <Buscador onSelect={handleSearchSelect} accent={accent} />
        </div>

        {/* Acciones (derecha) */}
        <div className="flex items-center gap-2">
          {mode === 'editor' && <ImportExportMenu />}
          <button
            onClick={goHome}
            title="Volver al inicio y cambiar de modo"
            className="flex items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-800 px-3 py-1.5 text-sm text-ink-100 transition hover:bg-ink-700"
          >
            <IconHome width={15} height={15} />
            <span className="hidden sm:inline">Inicio</span>
          </button>
        </div>
      </header>

      {/* ---- Contenido ---- */}
      <main className="relative min-h-0 flex-1">
        {view === '2d' &&
          (mapView === 'plano' ? (
            <Plano2D mode={mode} onOpenShelf={(id) => openShelf(id)} highlightShelfId={highlightShelfId} />
          ) : (
            <ListaInventario mode={mode} onOpenProduct={handleSearchSelect} />
          ))}
        {view === '3d' && selectedShelf && (
          <Vista3D shelf={selectedShelf} mode={mode} onBack={backTo2D} initialHighlight={productHighlight} />
        )}
      </main>
    </div>
  )
}

function ModeBadge({ mode }) {
  if (mode === 'editor') {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-editor/40 bg-editor/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-editor-soft">
        <IconEdit width={13} height={13} /> Modo Editor
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-guest/40 bg-guest/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-guest-soft">
      <IconEye width={13} height={13} /> Modo Invitado
    </span>
  )
}
