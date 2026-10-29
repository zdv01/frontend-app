import { Outlet } from 'react-router-dom'
import { Logo } from '../components/Logo'
import './AuthLayout.css'

// Marco de las pantallas públicas (login, registro, 2FA...): sin menú,
// solo el logo y una tarjeta centrada donde se dibuja la pantalla actual.
export function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-logo">
          <Logo />
        </div>
        <Outlet />
      </div>
      <p className="auth-footer">© {new Date().getFullYear()} SportManager · Módulo de seguridad</p>
    </div>
  )
}
