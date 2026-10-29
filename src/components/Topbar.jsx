import { Bell, ChevronDown, LogOut, Menu, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePageMeta } from '../hooks/usePageMeta'
import { MOCK_NOTIFICATIONS_COUNT } from '../services/mock/mockData'
import { Avatar } from './Avatar'
import './Topbar.css'

export function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { title, subtitle } = usePageMeta()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Cierra el menú del usuario al hacer clic fuera de él o al presionar Escape
  useEffect(() => {
    if (!menuOpen) return undefined
    const handleClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false)
    }
    const handleKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [menuOpen])

  const goToProfile = () => {
    setMenuOpen(false)
    navigate('/profile')
  }

  // Al cerrar sesión, ProtectedRoute lleva al login (sin recordar esta página)
  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
  }

  const roleLabel = user?.roles?.[0]?.description ?? 'Sin rol asignado'

  return (
    <header className="topbar">
      <button
        type="button"
        className="btn btn-icon topbar-menu-btn"
        onClick={onMenuClick}
        aria-label="Abrir menú"
      >
        <Menu size={24} />
      </button>

      <div className="topbar-heading">
        <h1 className="topbar-title">{title}</h1>
        {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
      </div>

      <div className="topbar-actions">
        <button type="button" className="btn btn-icon topbar-bell" aria-label="Notificaciones">
          <Bell size={26} strokeWidth={1.75} />
          {MOCK_NOTIFICATIONS_COUNT > 0 && (
            <span className="topbar-badge">{MOCK_NOTIFICATIONS_COUNT}</span>
          )}
        </button>

        <div className="topbar-user" ref={menuRef}>
          <button
            type="button"
            className="topbar-user-btn"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Avatar name={user?.name} photo={user?.photo} size={48} online />
            <span className="topbar-user-text">
              <span className="topbar-user-name">{user?.name}</span>
              <span className="topbar-user-role">{roleLabel}</span>
            </span>
            <ChevronDown size={18} />
          </button>

          {menuOpen && (
            <div className="topbar-menu" role="menu">
              <button type="button" role="menuitem" onClick={goToProfile}>
                <UserRound size={18} /> Mi perfil
              </button>
              <button
                type="button"
                role="menuitem"
                className="topbar-menu-danger"
                onClick={handleLogout}
              >
                <LogOut size={18} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
