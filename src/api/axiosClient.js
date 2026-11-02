import axios from 'axios'
import { env } from '../config/env'
import { clearSession, getToken } from '../utils/authStorage'

// Evento que avisa al AuthContext de que la sesión ya no es válida
export const SESSION_EXPIRED_EVENT = 'auth:session-expired'

// Instancia única de axios: todas las peticiones salen con esta configuración
export const axiosClient = axios.create({
  baseURL: env.apiUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Antes de cada petición: si hay token guardado, se agrega el encabezado Authorization.
// Si la petición ya trae uno (por ejemplo justo después del login), se respeta.
axiosClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Después de cada respuesta: si el backend dice 401 (token inválido o expirado),
// se borra la sesión y se avisa a la app para que vuelva al login.
// Solo se excluyen los endpoints de credenciales; /auth/me debe invalidar la sesión.
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? ''
    const isCredentialRequest = [
      '/auth/login',
      '/auth/register',
      '/auth/2fa/verify',
      '/auth/oauth/firebase',
    ].some((path) => url.startsWith(path))
    if (error.response?.status === 401 && !isCredentialRequest) {
      clearSession()
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
    return Promise.reject(error)
  },
)
