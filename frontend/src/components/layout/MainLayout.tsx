import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

/**
 * Main layout wrapper — Navbar on top, content below.
 * Used by all routes via React Router's layout route pattern.
 */
export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer
        className="border-t py-6 text-center text-sm"
        style={{
          borderColor: 'var(--color-outline-variant)',
          color: 'var(--color-on-surface-variant)',
        }}
      >
        © 2026 AudioQBox — Estudio de Ensayo Musical
      </footer>
    </div>
  )
}
