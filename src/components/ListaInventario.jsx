import { useState, useMemo } from 'react'
import { useInventory } from '../context/InventoryContext'
import { IconSearch, IconBox, IconEye } from './Icons'

export default function ListaInventario({ mode, onOpenProduct }) {
  const { allProducts } = useInventory()
  const [q, setQ] = useState('')
  const accent = mode === 'editor' ? '#f59e0b' : '#60a5fa'

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    let list = allProducts()
    if (term) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.code.toLowerCase().includes(term) ||
          p.shelfName.toLowerCase().includes(term) ||
          p.levelLabel.toLowerCase().includes(term),
      )
    }
    return list.sort(
      (a, b) => a.shelfName.localeCompare(b.shelfName) || a.levelLabel.localeCompare(b.levelLabel),
    )
  }, [q, allProducts])

  return (
    <div className="flex h-full flex-col bg-ink-950">
      {/* Barra de filtro */}
      <div className="flex items-center justify-between gap-3 border-b border-ink-700 px-4 py-3">
        <div className="relative w-full max-w-sm">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-600">
            <IconSearch width={15} height={15} />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filtrar por nombre, código, estantería…"
            className="w-full rounded-lg border border-ink-700 bg-ink-900 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-ink-600"
          />
        </div>
        <span className="flex flex-shrink-0 items-center gap-1.5 text-sm text-ink-600">
          <IconBox width={15} height={15} /> {rows.length} productos
        </span>
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-ink-900 text-left text-xs uppercase tracking-wide text-ink-600">
            <tr>
              <th className="px-4 py-2.5 font-medium">Código</th>
              <th className="px-4 py-2.5 font-medium">Producto</th>
              <th className="px-4 py-2.5 font-medium">Estantería</th>
              <th className="px-4 py-2.5 font-medium">Estante</th>
              <th className="px-4 py-2.5 font-medium">Posición</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-ink-600">
                  No hay productos que coincidan.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => onOpenProduct(p)}
                  className="cursor-pointer border-b border-ink-800/60 transition hover:bg-ink-850"
                >
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 rounded-[3px] border border-white/10" style={{ backgroundColor: p.color }} />
                      <span className="font-mono text-xs" style={{ color: accent }}>
                        {p.code}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-white">{p.name}</td>
                  <td className="px-4 py-2.5 text-ink-100">{p.shelfName}</td>
                  <td className="px-4 py-2.5 text-ink-100">{p.levelLabel}</td>
                  <td className="px-4 py-2.5">
                    <span className="flex flex-wrap gap-1 text-[10px] text-ink-600">
                      <span className="rounded bg-ink-800 px-1.5 py-0.5">col {(p.col ?? 0) + 1}</span>
                      <span className="rounded bg-ink-800 px-1.5 py-0.5">alto {(p.tier ?? 0) + 1}</span>
                      <span className="rounded bg-ink-800 px-1.5 py-0.5">fondo {(p.depth ?? 0) + 1}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="inline-flex items-center gap-1 text-xs text-ink-600 transition group-hover:text-white">
                      <IconEye width={14} height={14} /> Ver
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
