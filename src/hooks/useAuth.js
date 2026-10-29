import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

// Da acceso a la sesión: const { user, login, logout, can } = useAuth()
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return context
}
