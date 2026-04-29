import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Music, CalendarDays, Guitar, ArrowRight } from 'lucide-react'

/**
 * Public landing page for AudioQBox.
 * All user-facing text in Spanish.
 */
export default function HomePage() {
  const { user } = useAuth()

  return (
    <div>
      {/* Hero Section */}
      <section
        className="py-24 px-6"
        style={{ backgroundColor: 'var(--color-inverse-surface)' }}
      >
        <div className="max-w-[1280px] mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <Music size={32} style={{ color: 'var(--color-on-primary)' }} />
            </div>
          </div>

          <h1
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
            style={{ color: 'var(--color-inverse-on-surface)' }}
          >
            Tu sala de ensayo, lista cuando la necesites
          </h1>

          <p
            className="text-lg max-w-2xl mx-auto mb-10"
            style={{ color: 'var(--color-outline-variant)' }}
          >
            Reserva salas de práctica y alquila equipos — rápido, en línea, sin llamadas.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded font-medium no-underline transition-colors"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-on-primary)',
                }}
              >
                Ir al Panel
                <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded font-medium no-underline transition-colors"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-on-primary)',
                  }}
                >
                  Comenzar
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded font-medium no-underline border transition-colors"
                  style={{
                    color: 'var(--color-inverse-on-surface)',
                    borderColor: 'var(--color-outline)',
                    backgroundColor: 'transparent',
                  }}
                >
                  Iniciar sesión
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-[1280px] mx-auto">
          <h2
            className="text-2xl font-semibold text-center mb-12"
            style={{ color: 'var(--color-on-surface)' }}
          >
            Todo lo que necesitas para ensayar
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card: Rooms */}
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: '#ffffff',
                borderColor: 'var(--color-outline-variant)',
              }}
            >
              <div
                className="w-10 h-10 rounded flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--color-primary-light)' }}
              >
                <CalendarDays size={20} style={{ color: 'var(--color-primary)' }} />
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: 'var(--color-on-surface)' }}
              >
                Reserva de Salas
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--color-on-surface-variant)' }}
              >
                Escoge tu sala, elige horario y duración. Sin complicaciones, todo desde la web.
              </p>
            </div>

            {/* Card: Equipment */}
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: '#ffffff',
                borderColor: 'var(--color-outline-variant)',
              }}
            >
              <div
                className="w-10 h-10 rounded flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--color-primary-light)' }}
              >
                <Guitar size={20} style={{ color: 'var(--color-primary)' }} />
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: 'var(--color-on-surface)' }}
              >
                Alquiler de Equipos
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--color-on-surface-variant)' }}
              >
                Amplificadores, micrófonos, baterías y más. Revisa disponibilidad y alquila al instante.
              </p>
            </div>

            {/* Card: Management */}
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: '#ffffff',
                borderColor: 'var(--color-outline-variant)',
              }}
            >
              <div
                className="w-10 h-10 rounded flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--color-primary-light)' }}
              >
                <Music size={20} style={{ color: 'var(--color-primary)' }} />
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: 'var(--color-on-surface)' }}
              >
                Gestión Completa
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--color-on-surface-variant)' }}
              >
                El administrador controla salas, inventario, horarios y reservas desde un solo panel.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
