import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SESSION_EXPIRED_EVENT } from '../api/axiosClient'
import { permissionKey } from '../constants/permissions'
import { authService } from '../services'
import { clearSession, loadSession, saveSession } from '../utils/authStorage'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  // Al abrir la app se intenta recuperar la sesión guardada (si no expiró)
  const [session, setSession] = useState(() => loadSession())
  const validatedToken = useRef(null)
  // true si el usuario cerró sesión a propósito (no por expiración): así el login
  // no lo devuelve a la página donde estaba el usuario anterior
  const [loggedOut, setLoggedOut] = useState(false)

  const startSession = useCallback((newSession) => {
    saveSession(newSession)
    setSession(newSession)
    setLoggedOut(false)
    return newSession
  }, [])

  const endSession = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  // Si el usuario tiene 2FA, devuelve { requires2FA, challengeId, ... } SIN abrir la sesión
  const login = useCallback(
    async (email, password) => {
      const result = await authService.login(email, password)
      return result.requires2FA ? result : startSession(result)
    },
    [startSession],
  )

  const loginWithOAuth = useCallback(
    async (provider) => {
      const result = await authService.loginWithFirebase(provider)
      return result.requires2FA ? result : startSession(result)
    },
    [startSession],
  )

  const register = useCallback(
    async (data) => {
      const result = await authService.register(data)
      return result?.token ? startSession(result) : result
    },
    [startSession],
  )

  const verifyTwoFactor = useCallback(
    async (challengeId, code) => startSession(await authService.verifyTwoFactor(challengeId, code)),
    [startSession],
  )

  const completeOAuth = useCallback(
    async (params) => startSession(await authService.completeOAuth(params)),
    [startSession],
  )

  const logout = useCallback(async () => {
    try {
      await authService.logout(session?.token)
    } catch {
      // Aunque el backend falle, la sesión local se cierra igual
    }
    setLoggedOut(true)
    endSession()
  }, [session, endSession])

  // Vuelve a leer roles y permisos (tras cambiar la matriz o las asignaciones de roles)
  const refreshSession = useCallback(async () => {
    if (!session) return
    try {
      startSession(await authService.refreshSession(session))
    } catch (error) {
      if (error.response?.status === 401) endSession()
    }
  }, [session, startSession, endSession])

  // Actualiza datos del usuario en la sesión (foto, 2FA) sin volver a iniciar sesión
  const updateUser = useCallback(
    (changes) => {
      if (!session) return
      startSession({ ...session, user: { ...session.user, ...changes } })
    },
    [session, startSession],
  )

  // Cierra la sesión automáticamente cuando llega la fecha de expiración del token
  useEffect(() => {
    if (!session) return undefined
    const msLeft = new Date(session.expiresAt).getTime() - Date.now()
    const timer = setTimeout(endSession, Math.max(msLeft, 0))
    return () => clearTimeout(timer)
  }, [session, endSession])

  // Valida la sesión contra el backend al restaurarla, incluida la revocación por logout.
  useEffect(() => {
    if (!session?.token || validatedToken.current === session.token) return undefined
    validatedToken.current = session.token
    let active = true
    authService
      .refreshSession(session)
      .then((freshSession) => {
        if (active) startSession(freshSession)
      })
      .catch((error) => {
        if (active && error.response?.status === 401) endSession()
      })
    return () => {
      active = false
    }
  }, [session, startSession, endSession])

  // Si axios recibe un 401, avisa con este evento y aquí se limpia la sesión
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, endSession)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, endSession)
  }, [endSession])

  const value = useMemo(() => {
    const permissions = session?.permissions ?? []
    return {
      user: session?.user ?? null,
      token: session?.token ?? null,
      expiresAt: session?.expiresAt ?? null,
      permissions,
      isAuthenticated: Boolean(session),
      loggedOut,
      login,
      register,
      loginWithOAuth,
      verifyTwoFactor,
      completeOAuth,
      logout,
      refreshSession,
      updateUser,
      // ¿El usuario tiene este permiso en al menos uno de sus roles?
      can: (resource, operation) => permissions.includes(permissionKey(resource, operation)),
    }
  }, [
    session,
    loggedOut,
    login,
    register,
    loginWithOAuth,
    verifyTwoFactor,
    completeOAuth,
    logout,
    refreshSession,
    updateUser,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
