import { useAuth } from '../contexts/AuthContext'
import {
  CalendarDays,
  Guitar,
  LayoutDashboard,
  Package,
  Settings,
  Users,
} from 'lucide-react'

/**
 * Authenticated user's dashboard / central hub.
 * Shows different content based on role (user vs owner).
 * All user-facing text in Spanish.
 */
export default function DashboardPage() {
  const { profile } = useAuth()

  const isOwner = profile?.role === 'owner'

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10">
      {/* Welcome header */}
      <div className="mb-10">
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ color: 'var(--color-on-surface)' }}
        >
          Bienvenido, {profile?.full_name || 'Usuario'}
        </h1>
        <div className="flex items-center gap-3 mt-2">
          <p
            className="text-sm"
            style={{ color: 'var(--color-on-surface-variant)' }}
          >
            {profile?.email}
          </p>
          <span
            className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
            style={{
              backgroundColor: isOwner
                ? 'var(--color-primary-light)'
                : 'var(--color-surface-container)',
              color: isOwner
                ? 'var(--color-primary-dark)'
                : 'var(--color-on-surface-variant)',
            }}
          >
            {isOwner ? 'Administrador' : 'Usuario'}
          </span>
        </div>
      </div>

      {/* Quick actions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User cards — always visible */}
        <DashboardCard
          icon={<CalendarDays size={24} />}
          title="Mis Reservas"
          description="Consulta, gestiona o cancela tus reservas de salas."
          tag="Próximamente"
        />
        <DashboardCard
          icon={<Guitar size={24} />}
          title="Mis Alquileres"
          description="Revisa tus alquileres de equipos activos y pasados."
          tag="Próximamente"
        />
        <DashboardCard
          icon={<Package size={24} />}
          title="Catálogo de Equipos"
          description="Explora el inventario disponible para alquiler."
          tag="Próximamente"
        />

        {/* Owner-only cards */}
        {isOwner && (
          <>
            <DashboardCard
              icon={<LayoutDashboard size={24} />}
              title="Gestión de Salas"
              description="Crea, edita y administra las salas de ensayo."
              tag="Próximamente"
              highlight
            />
            <DashboardCard
              icon={<Users size={24} />}
              title="Todas las Reservas"
              description="Vista general de todas las reservas del estudio."
              tag="Próximamente"
              highlight
            />
            <DashboardCard
              icon={<Settings size={24} />}
              title="Configuración"
              description="Horarios del estudio, políticas de cancelación y más."
              tag="Próximamente"
              highlight
            />
          </>
        )}
      </div>

      {/* Profile info card */}
      <div className="mt-10">
        <h2
          className="text-lg font-semibold mb-4"
          style={{ color: 'var(--color-on-surface)' }}
        >
          Mi Perfil
        </h2>
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: '#ffffff',
            borderColor: 'var(--color-outline-variant)',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProfileField label="Nombre completo" value={profile?.full_name || '—'} />
            <ProfileField label="Correo electrónico" value={profile?.email || '—'} />
            <ProfileField label="Teléfono" value={profile?.phone || 'No registrado'} />
            <ProfileField label="Rol" value={isOwner ? 'Administrador' : 'Usuario'} />
            <ProfileField
              label="Miembro desde"
              value={
                profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '—'
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Sub-components
   ============================================================ */

interface DashboardCardProps {
  icon: React.ReactNode
  title: string
  description: string
  tag?: string
  highlight?: boolean
}

function DashboardCard({ icon, title, description, tag, highlight }: DashboardCardProps) {
  return (
    <div
      className="p-6 rounded-lg border transition-colors cursor-default"
      style={{
        backgroundColor: '#ffffff',
        borderColor: highlight
          ? 'var(--color-primary-light)'
          : 'var(--color-outline-variant)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded flex items-center justify-center"
          style={{
            backgroundColor: highlight
              ? 'var(--color-primary-light)'
              : 'var(--color-surface-container)',
            color: highlight
              ? 'var(--color-primary)'
              : 'var(--color-on-surface-variant)',
          }}
        >
          {icon}
        </div>
        {tag && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded"
            style={{
              backgroundColor: 'var(--color-surface-container)',
              color: 'var(--color-on-surface-variant)',
            }}
          >
            {tag}
          </span>
        )}
      </div>
      <h3
        className="text-base font-semibold mb-1"
        style={{ color: 'var(--color-on-surface)' }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed"
        style={{ color: 'var(--color-on-surface-variant)' }}
      >
        {description}
      </p>
    </div>
  )
}

interface ProfileFieldProps {
  label: string
  value: string
}

function ProfileField({ label, value }: ProfileFieldProps) {
  return (
    <div>
      <dt
        className="text-xs font-semibold uppercase tracking-wide mb-1"
        style={{ color: 'var(--color-on-surface-variant)' }}
      >
        {label}
      </dt>
      <dd
        className="text-sm font-medium"
        style={{ color: 'var(--color-on-surface)' }}
      >
        {value}
      </dd>
    </div>
  )
}
