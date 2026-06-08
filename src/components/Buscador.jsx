import { useState, useMemo, useRef, useEffect } from 'react'
import { useInventory } from '../context/InventoryContext'
import { IconSearch, IconClose } from './Icons'

export default function Buscador({ onSelect, accent = '#f59e0b' }) {
  const { allProducts } = useInventory()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const boxRef = useRef(null)

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return []
    return allProducts()
      .filter((p) => p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term))
      .slice(0, 12)
  }, [q, allProducts])

  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => setActive(0), [q])

  const choose = (p) => {
    onSelect?.(p)
    setOpen(false)
    setQ('')
  }

  const onKeyDown = (e) => {
    if (!results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(results[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-600">
          <IconSearch width={16} height={16} />
        </span>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => q && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Buscar producto por nombre o código…"
          className="w-full rounded-lg border border-ink-700 bg-ink-900/80 py-2 pl-9 pr-9 text-sm text-white outline-none transition placeholder:text-ink-600 focus:border-ink-600 focus:ring-2"
          style={{ '--tw-ring-color': `${accent}33` }}
        />
        {q && (
          <button
            onClick={() => {
              setQ('')
              setOpen(false)
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded text-ink-600 hover:bg-ink-700 hover:text-white"
          >
            <IconClose width={14} height={14} />
          </button>
        )}
      </div>

      {open && q && (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-ink-700 bg-ink-850 shadow-2xl animate-scale-in">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-ink-600">
              Sin resultados para “{q}”.
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((p, i) => (
                <li key={p.id}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(p)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
                      i === active ? 'bg-ink-700' : 'hover:bg-ink-800'
                    }`}
                  >
                    <span
                      className="h-7 w-7 flex-shrink-0 rounded-md border border-white/10"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">{p.name}</span>
                      <span className="block truncate text-xs text-ink-600">
                        {p.shelfName} · {p.levelLabel}
                      </span>
                    </span>
                    <span className="flex-shrink-0 rounded bg-ink-900 px-2 py-0.5 font-mono text-xs" style={{ color: accent }}>
                      {p.code}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
