import { useState, useEffect } from 'react'
import { useInventory } from '../context/InventoryContext'
import { Modal, Button, Field } from './ui'

const ACCENT = '#f59e0b'

export default function MoveProductModal({ open, onClose, product }) {
  const { shelves, moveProduct } = useInventory()
  const [shelfId, setShelfId] = useState('')
  const [levelId, setLevelId] = useState('')

  useEffect(() => {
    if (open && product) {
      setShelfId(product.shelfId || shelves[0]?.id || '')
    }
  }, [open, product, shelves])

  const currentShelf = shelves.find((s) => s.id === shelfId)

  useEffect(() => {
    if (currentShelf) {
      // Por defecto el primer estante distinto al actual si es posible
      const first = currentShelf.levels[0]
      setLevelId(first ? first.id : '')
    }
  }, [shelfId]) // eslint-disable-line

  if (!product) return null

  const selectClass =
    'w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white outline-none focus:border-editor/60'

  return (
    <Modal open={open} onClose={onClose} accent={ACCENT} title="Mover producto">
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2">
          <span className="h-7 w-7 rounded-md border border-white/10" style={{ backgroundColor: product.color }} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{product.name}</p>
            <p className="font-mono text-xs text-ink-600">{product.code}</p>
          </div>
        </div>

        <Field label="Estantería destino">
          <select className={selectClass} value={shelfId} onChange={(e) => setShelfId(e.target.value)}>
            {shelves.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Estante destino">
          <select className={selectClass} value={levelId} onChange={(e) => setLevelId(e.target.value)}>
            {currentShelf?.levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            accent={ACCENT}
            disabled={!levelId}
            onClick={() => {
              moveProduct(product.id, shelfId, levelId)
              onClose()
            }}
          >
            Mover aquí
          </Button>
        </div>
      </div>
    </Modal>
  )
}
