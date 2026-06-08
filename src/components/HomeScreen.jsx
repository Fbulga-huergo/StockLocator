import { IconEdit, IconEye, IconShelf, IconChevron } from './Icons'

export default function HomeScreen({ onSelectMode }) {
  return (
    <div className="grain relative flex min-h-full items-center justify-center overflow-hidden bg-ink-950 px-6 py-12">
      {/* Halos de fondo */}
      <div className="pointer-events-none absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-editor/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[520px] w-[520px] rounded-full bg-guest/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-3xl">
        <header className="mb-12 text-center animate-fade-in">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-850/60 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-ink-600">
            <IconShelf width={14} height={14} /> Gestor de depósito
          </div>
          <h1 className="font-display text-5xl font-extrabold tracking-display text-white sm:text-6xl">
            Inventario en
            <br />
            <span className="bg-gradient-to-r from-editor via-editor-soft to-guest bg-clip-text text-transparent">
              estanterías físicas
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink-600">
            Plano 2D editable, vista 3D de cada estantería y búsqueda global de productos.
            Elegí cómo querés entrar en esta sesión.
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2">
          <ModeCard
            accent="#f59e0b"
            title="Entrar como Editor"
            tag="Administrador"
            icon={<IconEdit width={22} height={22} />}
            features={['Crear, mover y eliminar', 'Gestionar productos y estantes', 'Importar / exportar datos']}
            onClick={() => onSelectMode('editor')}
            delay="0.05s"
          />
          <ModeCard
            accent="#60a5fa"
            title="Entrar como Invitado"
            tag="Solo lectura"
            icon={<IconEye width={22} height={22} />}
            features={['Navegar plano 2D y vista 3D', 'Buscar productos', 'Consultar ubicaciones']}
            onClick={() => onSelectMode('guest')}
            delay="0.12s"
          />
        </div>

        <p className="mt-8 text-center text-xs text-ink-600 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Sin contraseña · El modo es solo para esta sesión · Los datos quedan guardados en este navegador
        </p>
      </div>
    </div>
  )
}

function ModeCard({ accent, title, tag, icon, features, onClick, delay }) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-ink-700 bg-ink-850/70 p-6 text-left transition-all duration-300 hover:-translate-y-1 animate-fade-in"
      style={{ animationDelay: delay }}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-40"
        style={{ backgroundColor: accent }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
        style={{ backgroundColor: accent }}
      />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <span
            className="grid h-12 w-12 place-items-center rounded-xl border"
            style={{ borderColor: `${accent}55`, backgroundColor: `${accent}18`, color: accent }}
          >
            {icon}
          </span>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: `${accent}1a`, color: accent }}
          >
            {tag}
          </span>
        </div>
        <h2 className="font-display text-xl font-bold tracking-display text-white">{title}</h2>
        <ul className="mt-4 space-y-1.5">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-ink-100/80">
              <span className="h-1 w-1 rounded-full" style={{ backgroundColor: accent }} />
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-center gap-1 text-sm font-medium" style={{ color: accent }}>
          Entrar
          <IconChevron width={16} height={16} className="transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  )
}
