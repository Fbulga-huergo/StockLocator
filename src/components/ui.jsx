import { useEffect } from 'react'
import { IconClose } from './Icons'

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-md', accent = '#f59e0b' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />
      <div
        className={`relative w-full ${maxWidth} animate-scale-in rounded-2xl border border-ink-700 bg-ink-850 shadow-2xl`}
        style={{ boxShadow: `0 0 0 1px ${accent}22, 0 24px 60px -12px rgba(0,0,0,0.7)` }}
      >
        <div className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
          <h2 className="font-display text-lg font-semibold tracking-display" style={{ color: accent }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-600 transition hover:bg-ink-700 hover:text-white"
          >
            <IconClose width={16} height={16} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}

export function Button({ children, variant = 'solid', accent = '#f59e0b', className = '', ...props }) {
  const styles = {
    solid: {
      backgroundColor: accent,
      color: '#0a0c10',
    },
    ghost: {},
    danger: {},
  }
  const cls = {
    solid: 'font-semibold hover:brightness-110',
    ghost: 'border border-ink-700 bg-ink-800 text-ink-100 hover:bg-ink-700',
    danger: 'border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${cls[variant]} ${className}`}
      style={styles[variant]}
      {...props}
    >
      {children}
    </button>
  )
}

export function Field({ label, error, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-600">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-600">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  )
}

export function TextInput({ className = '', invalid, ...props }) {
  return (
    <input
      className={`w-full rounded-lg border bg-ink-900 px-3 py-2 text-sm text-white outline-none transition placeholder:text-ink-600 focus:border-editor/60 focus:ring-2 focus:ring-editor/20 ${
        invalid ? 'border-red-500/60' : 'border-ink-700'
      } ${className}`}
      {...props}
    />
  )
}
