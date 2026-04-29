import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

/**
 * 404 page — shown when no route matches.
 * All user-facing text in Spanish.
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-6">
      <div className="text-center">
        <p
          className="text-8xl font-bold mb-4"
          style={{ color: 'var(--color-primary-light)' }}
        >
          404
        </p>
        <h1
          className="text-2xl font-semibold mb-2"
          style={{ color: 'var(--color-on-surface)' }}
        >
          Página no encontrada
        </h1>
        <p
          className="text-sm mb-8"
          style={{ color: 'var(--color-on-surface-variant)' }}
        >
          La página que buscas no existe o fue movida.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-medium no-underline transition-colors"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-on-primary)',
          }}
        >
          <Home size={18} />
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
