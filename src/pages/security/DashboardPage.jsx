import { KeyRound, ShieldCheck, Timer, Users } from 'lucide-react'
import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Chip } from '../../components/Badge'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAuth } from '../../hooks/useAuth'
import { permissionsService, rolesService, usersService } from '../../services'
import { formatDateTime } from '../../utils/format'

// Resumen de inicio: totales del módulo de seguridad (según lo que el usuario puede ver)
export function DashboardPage() {
  const { user, expiresAt, can } = useAuth()
  const canUsers = can('usuarios', 'listar')
  const canRoles = can('roles', 'listar')
  const canPermissions = can('permisos', 'listar')

  const loader = useCallback(
    () =>
      Promise.all([
        canUsers ? usersService.list() : null,
        canRoles ? rolesService.list() : null,
        canPermissions ? permissionsService.list() : null,
      ]),
    [canUsers, canRoles, canPermissions],
  )
  const { data, loading } = useAsyncData(loader)
  const [users, roles, permissions] = data ?? [null, null, null]

  const count = (list, label) => {
    if (loading && !data) return { value: '…', detail: '' }
    if (!list) return { value: '—', detail: 'Sin permiso para ver' }
    const active = list.filter((item) => item.active).length
    return { value: list.length, detail: `${active} ${label}` }
  }

  const cards = [
    { icon: Users, label: 'Usuarios', to: '/users', ...count(users, 'activos') },
    { icon: ShieldCheck, label: 'Roles', to: '/roles', ...count(roles, 'activos') },
    { icon: KeyRound, label: 'Permisos', to: '/permissions', ...count(permissions, 'activos') },
  ]

  return (
    <div className="page-stack">
      <section className="panel">
        <h2 className="section-title">Hola, {user.name}</h2>
        <p className="text-muted">Tu sesión vence: {formatDateTime(expiresAt)}</p>
        <div className="chip-list dashboard-roles">
          {user.roles.length ? (
            user.roles.map((role) => <Chip key={role.id}>{role.name}</Chip>)
          ) : (
            <span className="text-muted">No tienes roles asignados todavía.</span>
          )}
        </div>
      </section>

      <div className="stat-grid">
        {cards.map((card) => {
          const Icon = card.icon
          const content = (
            <>
              <span className="stat-card-icon">
                <Icon size={24} aria-hidden="true" />
              </span>
              <span>
                <span className="stat-card-value">{card.value}</span>
                <span className="stat-card-label"> {card.label}</span>
                {card.detail && <span className="stat-card-label stat-card-detail">{card.detail}</span>}
              </span>
            </>
          )
          return card.value === '—' ? (
            <div key={card.label} className="stat-card">
              {content}
            </div>
          ) : (
            <Link key={card.label} to={card.to} className="stat-card stat-card-link">
              {content}
            </Link>
          )
        })}
        <Link to="/security" className="stat-card stat-card-link">
          <span className="stat-card-icon">
            <Timer size={24} aria-hidden="true" />
          </span>
          <span>
            <span className="stat-card-value">{user.twoFactorEnabled ? 'Con 2FA' : 'Sin 2FA'}</span>
            <span className="stat-card-label stat-card-detail">Seguridad de tu cuenta</span>
          </span>
        </Link>
      </div>
    </div>
  )
}
