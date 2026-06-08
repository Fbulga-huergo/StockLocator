import { useRef, useState } from 'react'
import { useInventory } from '../context/InventoryContext'
import { exportCSV, importCSV, exportJSON, importJSON } from '../lib/io'
import { IconDownload, IconUpload, IconChevron } from './Icons'

export default function ImportExportMenu() {
  const { shelves, state, replaceAll } = useInventory()
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState(null) // {type, msg}
  const csvInput = useRef(null)
  const jsonInput = useRef(null)
  const [pendingCSV, setPendingCSV] = useState(null)

  const notify = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const handleCSVFile = (file) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const result = importCSV(reader.result, shelves)
        setPendingCSV(result)
      } catch (err) {
        notify('error', err.message)
      }
    }
    reader.readAsText(file)
  }

  const handleJSONFile = (file) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const result = importJSON(reader.result)
        replaceAll(result)
        notify('ok', `Backup restaurado: ${result.shelves.length} estanterías.`)
      } catch (err) {
        notify('error', err.message)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-800 px-3 py-1.5 text-sm text-ink-100 transition hover:bg-ink-700"
      >
        <IconDownload width={15} height={15} /> Datos
        <IconChevron width={13} height={13} className={`transition ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-xl border border-ink-700 bg-ink-850 py-1.5 shadow-2xl animate-scale-in">
            <MenuItem
              icon={<IconDownload width={15} height={15} />}
              label="Exportar CSV"
              hint="Código, Nombre, Estantería, Estante"
              onClick={() => {
                exportCSV(shelves)
                setOpen(false)
              }}
            />
            <MenuItem
              icon={<IconUpload width={15} height={15} />}
              label="Importar CSV"
              hint="Reemplaza el inventario actual"
              onClick={() => {
                csvInput.current?.click()
                setOpen(false)
              }}
            />
            <div className="my-1.5 border-t border-ink-700" />
            <MenuItem
              icon={<IconDownload width={15} height={15} />}
              label="Exportar JSON (backup)"
              hint="Copia completa con posiciones"
              onClick={() => {
                exportJSON(state)
                setOpen(false)
              }}
            />
            <MenuItem
              icon={<IconUpload width={15} height={15} />}
              label="Importar JSON (restaurar)"
              hint="Reemplaza todo"
              onClick={() => {
                jsonInput.current?.click()
                setOpen(false)
              }}
            />
          </div>
        </>
      )}

      <input
        ref={csvInput}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleCSVFile(f)
          e.target.value = ''
        }}
      />
      <input
        ref={jsonInput}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleJSONFile(f)
          e.target.value = ''
        }}
      />

      {/* Confirmación de importación CSV */}
      {pendingCSV && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPendingCSV(null)} />
          <div className="relative w-full max-w-sm animate-scale-in rounded-2xl border border-editor/30 bg-ink-850 p-6">
            <h3 className="font-display text-lg font-semibold text-white">Importar CSV</h3>
            <p className="mt-2 text-sm text-ink-600">
              Se detectaron <span className="text-white">{pendingCSV.shelves.length} estanterías</span> y{' '}
              <span className="text-white">
                {pendingCSV.shelves.reduce((a, s) => a + s.levels.reduce((b, l) => b + l.products.length, 0), 0)}{' '}
                productos
              </span>
              . Esto reemplazará el inventario actual.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setPendingCSV(null)}
                className="rounded-lg border border-ink-700 bg-ink-800 px-4 py-2 text-sm text-ink-100 hover:bg-ink-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  replaceAll(pendingCSV)
                  notify('ok', 'Inventario importado desde CSV.')
                  setPendingCSV(null)
                }}
                className="rounded-lg bg-editor px-4 py-2 text-sm font-semibold text-ink-950 hover:brightness-110"
              >
                Reemplazar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg border px-4 py-3 text-sm shadow-2xl animate-fade-in ${
            toast.type === 'error'
              ? 'border-red-500/40 bg-red-500/15 text-red-200'
              : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function MenuItem({ icon, label, hint, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-start gap-2.5 px-3 py-2 text-left transition hover:bg-ink-800"
    >
      <span className="mt-0.5 text-ink-600">{icon}</span>
      <span>
        <span className="block text-sm text-white">{label}</span>
        <span className="block text-[11px] text-ink-600">{hint}</span>
      </span>
    </button>
  )
}
