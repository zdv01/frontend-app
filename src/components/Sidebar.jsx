import { ClipboardList, House, KeyRound, LockKeyhole, ShieldCheck, Users } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Logo } from './Logo'
import './Sidebar.css'

/*
 * Menú lateral. Cada entrada puede pedir un permiso: si el usuario no lo tiene,
 * la entrada no se muestra. "paths" indica con qué rutas se marca como activa
 * (por ejemplo, "Asignar permisos a roles" deja marcado "Roles", como en el mockup).
 */
const NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard', icon: House, paths: ['/dashboard'] },
  {
    label: 'Usuarios',
    to: '/users',
    icon: Users,
    paths: ['/users'],
    permission: ['usuarios', 'listar'],
  },
  {
    label: 'Roles',
    to: '/roles',
    icon: ShieldCheck,
    paths: ['/roles', '/role-permissions'],
    permission: ['roles', 'listar'],
  },
  {
    label: 'Permisos',
    to: '/permissions',
    icon: KeyRound,
    paths: ['/permissions'],
    permission: ['permisos', 'listar'],
  },
  { label: 'Seguridad', to: '/security', icon: LockKeyhole, paths: ['/security'] },
  { label: 'Auditoría', to: '/audit', icon: ClipboardList, paths: ['/audit'] },
]

export function Sidebar({ open, onClose }) {
  const { user, can } = useAuth()
  const { pathname } = useLocation()

  const visibleItems = NAV_ITEMS.filter((item) => !item.permission || can(...item.permission))
  const roleLabel = user?.roles?.[0]?.description ?? 'Sin rol asignado'

  return (
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="sidebar-logo">
        <Logo />
      </div>

      <nav className="sidebar-nav" aria-label="Menú principal">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const active = item.paths.some((path) => pathname.startsWith(path))
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={22} strokeWidth={1.75} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="sidebar-session">
        <div>
          <p className="sidebar-session-status">
            <span className="status-dot" aria-hidden="true" />
            Sesión activa
          </p>
          <p className="sidebar-session-role">{roleLabel}</p>
        </div>
        <ShieldCheck size={26} className="sidebar-session-icon" aria-hidden="true" />
      </div>
    </aside>
  )
}
