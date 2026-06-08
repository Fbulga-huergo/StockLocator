import { useState, useEffect } from 'react'
import { useInventory } from '../context/InventoryContext'
import { PRODUCT_COLORS, randomColor } from '../lib/utils'
import { Modal, Button, Field, TextInput } from './ui'

const ACCENT = '#f59e0b'

// mode: 'create' | 'edit'
export default function ProductModal({ open, onClose, mode, product, target }) {
  const { addProduct, updateProduct, codeExists } = useInventory()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [color, setColor] = useState(randomColor())
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && product) {
      setName(product.name)
      setCode(product.code)
      setColor(product.color)
    } else {
      setName('')
      setCode('')
      setColor(randomColor())
    }
    setError('')
  }, [open, mode, product])

  const submit = () => {
    const n = name.trim()
    const c = code.trim()
    if (!n) return setError('El nombre es obligatorio.')
    if (!c) return setError('El código es obligatorio.')
    if (codeExists(c, mode === 'edit' ? product.id : null)) {
      return setError(`El código “${c}” ya existe. Debe ser único.`)
    }
    if (mode === 'edit') {
      updateProduct(product.id, { name: n, code: c, color })
    } else {
      addProduct(target.shelfId, target.levelId, { name: n, code: c, color })
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      accent={ACCENT}
      title={mode === 'edit' ? 'Editar producto' : 'Nuevo producto'}
    >
      <div className="space-y-4">
        {target?.levelLabel && mode === 'create' && (
          <p className="rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-ink-600">
            Destino: <span className="text-ink-100">{target.shelfName}</span> · {target.levelLabel}
          </p>
        )}
        <Field label="Nombre">
          <TextInput
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Tornillos M6"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </Field>
        <Field label="Código (único)" invalid={!!error}>
          <TextInput
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ej. TOR-001"
            className="font-mono"
            invalid={error.includes('código') || error.includes('Código')}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </Field>
        <Field label="Color del cubo">
          <div className="flex flex-wrap gap-2">
            {PRODUCT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-md border-2 transition ${
                  color === c ? 'scale-110 border-white' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </Field>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button accent={ACCENT} onClick={submit}>
            {mode === 'edit' ? 'Guardar cambios' : 'Agregar producto'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
