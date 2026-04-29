import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireOwner?: boolean
}

/**
 * Route guard that redirects to /login if the user is not authenticated.
 * Optionally requires the 'owner' role.
 */
export default function ProtectedRoute({ children, requireOwner = false }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-surface)]">
        <div className="text-[var(--color-on-surface-variant)] text-lg">
          Cargando...
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireOwner && profile?.role !== 'owner') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
