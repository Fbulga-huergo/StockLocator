import { useState, useEffect } from 'react'
import { useInventory } from '../context/InventoryContext'
import { Modal, Button, Field, TextInput } from './ui'
import { IconPlus, IconTrash } from './Icons'

const ACCENT = '#f59e0b'

export default function ShelfConfigModal({ open, onClose, shelf }) {
  const { setLevelCount, renameLevel, renameShelf } = useInventory()
  const [name, setName] = useState('')
  const [labels, setLabels] = useState([])

  useEffect(() => {
    if (open && shelf) {
      setName(shelf.name)
      setLabels(shelf.levels.map((l) => l.label))
    }
  }, [open, shelf])

  if (!shelf) return null

  const apply = () => {
    if (name.trim() && name.trim() !== shelf.name) renameShelf(shelf.id, name.trim())
    // Ajustar cantidad primero
    if (labels.length !== shelf.levels.length) {
      setLevelCount(shelf.id, labels.length)
    }
    // Renombrar los que coinciden por índice
    shelf.levels.forEach((lvl, i) => {
      if (labels[i] != null && labels[i] !== lvl.label) {
        renameLevel(shelf.id, lvl.id, labels[i])
      }
    })
    onClose()
  }

  const addLevel = () => setLabels((ls) => [...ls, `Estante ${ls.length + 1}`])
  const removeLevel = (i) => setLabels((ls) => ls.filter((_, idx) => idx !== i))
  const editLabel = (i, v) => setLabels((ls) => ls.map((l, idx) => (idx === i ? v : l)))

  const productCount = (i) => (shelf.levels[i] ? shelf.levels[i].products.length : 0)

  return (
    <Modal open={open} onClose={onClose} accent={ACCENT} title="Configurar estantería" maxWidth="max-w-lg">
      <div className="space-y-5">
        <Field label="Nombre de la estantería">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-600">
              Estantes ({labels.length})
            </span>
            <Button variant="ghost" onClick={addLevel} className="!px-2.5 !py-1 text-xs">
              <IconPlus width={14} height={14} /> Agregar
            </Button>
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {labels.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-7 flex-shrink-0 text-center font-mono text-xs text-ink-600">{i + 1}</span>
                <TextInput value={label} onChange={(e) => editLabel(i, e.target.value)} />
                {i < shelf.levels.length && productCount(i) > 0 && (
                  <span className="flex-shrink-0 rounded bg-ink-700 px-2 py-1 text-[10px] text-ink-100">
                    {productCount(i)} prod.
                  </span>
                )}
                <button
                  onClick={() => removeLevel(i)}
                  disabled={labels.length <= 1}
                  className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-ink-600 transition hover:bg-red-500/15 hover:text-red-400 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <IconTrash width={15} height={15} />
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-600">
            Al quitar un estante con productos, éstos se mueven automáticamente al último estante restante.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button accent={ACCENT} onClick={apply}>
            Aplicar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
