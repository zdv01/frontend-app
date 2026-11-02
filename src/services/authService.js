
import { axiosClient } from '../api/axiosClient'
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  getIdToken,
  signInWithPopup,
} from 'firebase/auth'
import { firebaseAuth, isFirebaseConfigured } from '../config/firebase'
import { env } from '../config/env'
import { toPermissionKey, toRole } from './mappers'
import * as mock from './mock/authMock'

/*
 * Autenticación (HU-SE-07, 08, 09, 10).
 * Todas las funciones que inician sesión devuelven el mismo formato:
 * { token, expiresAt, user: { id, name, email, authProvider, twoFactorEnabled, photo, roles },
 *   permissions: ['usuarios:ver', ...] }
 * Los endpoints marcados con (propuesto) todavía no existen en el backend:
 * ver docs/contrato-api-frontend.md
 */

// Lee el contenido (payload) de un JWT sin validarlo; la validación la hace el backend
function decodeJwt(token) {
  const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(payload))
}

const firebaseProviders = {
  google: () => new GoogleAuthProvider(),
  github: () => new GithubAuthProvider(),
  microsoft: () => new OAuthProvider('microsoft.com'),
}

function firebaseError(message) {
  const error = new Error(message)
  error.response = { status: 400, data: { message } }
  return error
}

function getFirebaseErrorMessage(error) {
  const messages = {
    'auth/popup-closed-by-user': 'Cerraste la ventana de autenticación.',
    'auth/popup-blocked': 'El navegador bloqueó la ventana de autenticación.',
    'auth/account-exists-with-different-credential':
      'Este correo ya está registrado con otro método de acceso.',
    'auth/cancelled-popup-request': 'Ya hay una autenticación en curso.',
  }
  return messages[error.code] || 'No se pudo completar la autenticación con Firebase.'
}

// Con el token recién emitido, pide al backend quién es el usuario y qué puede hacer
async function buildSession(token, expiresAt) {
  const auth = { headers: { Authorization: `Bearer ${token}` } }

  try {
    // (propuesto) GET /api/auth/me → usuario + roles + permisos efectivos
    const { data } = await axiosClient.get('/auth/me', auth)
    return {
      token,
      expiresAt,
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        authProvider: data.authProvider ?? 'local',
        twoFactorEnabled: data.twoFactorEnabled ?? false,
        photo: data.photo ?? null,
        roles: (data.roles ?? []).map(toRole),
      },
      permissions: [...new Set((data.permissions ?? []).map(toPermissionKey))],
    }
  } catch (error) {
    if (error.response?.status !== 404) throw error
  }

  // Respaldo mientras no exista /auth/me: se arma con los endpoints que ya existen
  const userId = Number(decodeJwt(token).sub)
  const [{ data: user }, { data: userRoles }] = await Promise.all([
    axiosClient.get(`/users/${userId}`, auth),
    axiosClient.get(`/user-roles/users/${userId}`, auth),
  ])
  const roles = userRoles.map((userRole) => toRole(userRole.role))
  const rolePermissions = await Promise.all(
    roles.map((role) => axiosClient.get(`/role-permissions/roles/${role.id}`, auth)),
  )
  const permissions = rolePermissions.flatMap(({ data }) =>
    data.map((rolePermission) => toPermissionKey(rolePermission.permission)),
  )

  return {
    token,
    expiresAt,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      authProvider: user.authProvider ?? 'local',
      twoFactorEnabled: user.twoFactorEnabled ?? false,
      photo: null,
      roles,
    },
    permissions: [...new Set(permissions)],
  }
}

const api = {
  // POST /api/auth/login → { accessToken, tokenType, expiresAt }
  // o (propuesto) { requires2FA: true, challengeId } si el usuario tiene 2FA
  async login(email, password) {
    const { data } = await axiosClient.post('/auth/login', { email, password })
    if (data.requires2FA) {
      return { requires2FA: true, challengeId: data.challengeId, email }
    }
    return buildSession(data.accessToken, data.expiresAt)
  },

  // (propuesto) POST /api/auth/2fa/verify { challengeId, code } → { accessToken, expiresAt }
  async verifyTwoFactor(challengeId, code) {
    const { data } = await axiosClient.post('/auth/2fa/verify', { challengeId, code })
    return buildSession(data.accessToken, data.expiresAt)
  },

  // (propuesto) POST /api/auth/2fa/resend { challengeId }
  async resendTwoFactor(challengeId) {
    await axiosClient.post('/auth/2fa/resend', { challengeId })
    return {}
  },

  // (propuesto) POST /api/auth/register { name, email, password } — público
  async register(data) {
    const { data: user } = await axiosClient.post('/auth/register', data)
    return user
  },

  // (propuesto) POST /api/auth/forgot-password { email } → 204 siempre
  async forgotPassword(email) {
    await axiosClient.post('/auth/forgot-password', { email })
    return {}
  },

  // (propuesto) POST /api/auth/reset-password { token, password }
  async resetPassword(token, password) {
    await axiosClient.post('/auth/reset-password', { token, password })
  },

  // (propuesto) POST /api/auth/logout → invalida el token actual
  async logout() {
    await axiosClient.post('/auth/logout')
  },

  // Firebase autentica al usuario; el backend recibe el ID token y devuelve su JWT.
  async loginWithFirebase(providerName) {
    if (!isFirebaseConfigured()) {
      throw firebaseError(
        'Configura las variables VITE_FIREBASE_* en el archivo .env antes de usar este acceso.',
      )
    }
    const createProvider = firebaseProviders[providerName]
    if (!createProvider) throw firebaseError('Proveedor de autenticación no válido.')

    let result
    try {
      result = await signInWithPopup(firebaseAuth, createProvider())
      const idToken = await getIdToken(result.user)
      const { data } = await axiosClient.post('/auth/oauth/firebase', { idToken })
      if (data.requiresTwoFactor ?? data.requires2FA) {
        return {
          requires2FA: true,
          challengeId: data.challengeToken ?? data.challengeId,
          email: result.user.email,
        }
      }
      return buildSession(data.accessToken, data.expiresAt)
    } catch (error) {
      if (error.response) throw error
      throw firebaseError(getFirebaseErrorMessage(error))
    }
  },

  // El backend vuelve a /auth/callback?token=...&expiresAt=... o ?error=...
  async completeOAuth(params) {
    if (params.error) {
      const error = new Error(params.error)
      error.response = { status: 400, data: { message: params.error } }
      throw error
    }
    if (!params.token) {
      const error = new Error('Respuesta de OAuth incompleta')
      error.response = { status: 400, data: { message: 'No se recibió el token de acceso.' } }
      throw error
    }
    return buildSession(params.token, params.expiresAt)
  },

  async refreshSession(session) {
    return buildSession(session.token, session.expiresAt)
  },
}

export const authService = env.useMocks ? mock : api
