import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LogOut, User, Music } from 'lucide-react'

/**
 * Top navigation bar. Shows different actions based on auth state.
 * All user-facing text in Spanish.
 */
export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: 'var(--color-surface-container-low)',
        borderColor: 'var(--color-outline-variant)',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 no-underline"
          style={{ color: 'var(--color-on-surface)' }}
        >
          <Music size={24} style={{ color: 'var(--color-primary)' }} />
          <span className="text-xl font-semibold tracking-tight">
            AudioQBox
          </span>
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* User info */}
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-3 py-1.5 rounded no-underline transition-colors"
                style={{
                  color: 'var(--color-on-surface)',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = 'var(--color-surface-container)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                <User size={18} style={{ color: 'var(--color-on-surface-variant)' }} />
                <span className="text-sm font-medium">
                  {profile?.full_name || profile?.email || 'Mi cuenta'}
                </span>
                {profile?.role === 'owner' && (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'var(--color-primary-light)',
                      color: 'var(--color-primary-dark)',
                    }}
                  >
                    Admin
                  </span>
                )}
              </Link>

              {/* Sign out button */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium cursor-pointer transition-colors border"
                style={{
                  color: 'var(--color-on-surface-variant)',
                  backgroundColor: 'transparent',
                  borderColor: 'var(--color-outline-variant)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-error-container)'
                  e.currentTarget.style.color = 'var(--color-error)'
                  e.currentTarget.style.borderColor = 'var(--color-error)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--color-on-surface-variant)'
                  e.currentTarget.style.borderColor = 'var(--color-outline-variant)'
                }}
              >
                <LogOut size={16} />
                Salir
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium no-underline px-3 py-1.5 rounded transition-colors"
                style={{ color: 'var(--color-on-surface-variant)' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = 'var(--color-surface-container)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium no-underline px-4 py-2 rounded transition-colors"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-on-primary)',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'var(--color-primary)')
                }
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
