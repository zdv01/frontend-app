
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
 * Los nombres de los campos se normalizan aquí para que las pantallas no dependan
 * de las diferencias entre los DTO públicos del backend.
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
async function buildSession(token, expiresAt, providerHint = 'local') {
  const auth = { headers: { Authorization: `Bearer ${token}` } }

  const { data: currentUser } = await axiosClient.get('/auth/me', auth)
  const userId = Number(currentUser.id ?? decodeJwt(token).sub)
  const user = currentUser.id
    ? currentUser
    : (await axiosClient.get(`/users/${userId}`, auth)).data
  let roles = (currentUser.roles ?? []).map(toRole)
  let permissions = (currentUser.permissions ?? []).map(toPermissionKey)

  // El backend actual devuelve UserResponseDTO en /auth/me; en ese caso se
  // completan roles y permisos mediante las relaciones públicas.
  if (!roles.length) {
    const { data: userRoles } = await axiosClient.get(`/user-roles/users/${userId}`, auth)
    roles = userRoles.map((userRole) => toRole(userRole.role))
  }
  if (!permissions.length) {
    const rolePermissions = await Promise.all(
      roles.map((role) => axiosClient.get(`/role-permissions/roles/${role.id}`, auth)),
    )
    permissions = rolePermissions.flatMap(({ data }) =>
      data.map((rolePermission) => toPermissionKey(rolePermission.permission)),
    )
  }

  return {
    token,
    expiresAt,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      authProvider: user.authProvider ?? providerHint,
      twoFactorEnabled: user.twoFactorEnabled ?? false,
      photo: user.photo ?? null,
      roles,
    },
    permissions: [...new Set(permissions)],
  }
}

const api = {
  // POST /api/auth/login → { accessToken, tokenType, expiresAt, requiresTwoFactor, challengeToken }
  async login(email, password) {
    const { data } = await axiosClient.post('/auth/login', { email, password })
    if (data.requiresTwoFactor) {
      return {
        requires2FA: true,
        challengeId: data.challengeToken,
        email,
        expiresAt: data.expiresAt,
      }
    }
    return buildSession(data.accessToken, data.expiresAt, 'local')
  },

  // POST /api/auth/2fa/verify { challengeToken, code } → { accessToken, expiresAt }
  async verifyTwoFactor(challengeToken, code) {
    const { data } = await axiosClient.post('/auth/2fa/verify', { challengeToken, code })
    return buildSession(data.accessToken, data.expiresAt, 'local')
  },

  // El backend actual no expone un endpoint de reenvío. El código expira según
  // TWO_FACTOR_CODE_DURATION_MINUTES y el usuario puede iniciar el login otra vez.
  async resendTwoFactor() {
    throw firebaseError(
      'El reenvío de códigos todavía no está disponible. Inicia sesión nuevamente para solicitar otro código.',
    )
  },

  // POST /api/auth/register { name, email, password } — público
  async register(data) {
    const { data: response } = await axiosClient.post('/auth/register', data)
    return response.accessToken
      ? buildSession(response.accessToken, response.expiresAt)
      : response
  },

  // POST /api/auth/password-recovery { email } → 204 siempre
  async forgotPassword(email) {
    try {
      await axiosClient.post('/auth/password-recovery', { email })
    } catch (error) {
      // El contrato no revela si el correo existe; algunas versiones del backend
      // todavía responden 401 para cuentas inexistentes o OAuth.
      if ([400, 401, 404].includes(error.response?.status)) return {}
      throw error
    }
    return {}
  },

  // POST /api/auth/password-reset { token, newPassword }
  async resetPassword(token, password) {
    await axiosClient.post('/auth/password-reset', { token, newPassword: password })
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
      const idToken = await getIdToken(result.user, true)
      const { data } = await axiosClient.post('/auth/oauth/firebase', { idToken })
      if (data.requiresTwoFactor ?? data.requires2FA) {
        return {
          requires2FA: true,
          challengeId: data.challengeToken ?? data.challengeId,
          email: result.user.email,
        }
      }
      return buildSession(data.accessToken, data.expiresAt, providerName)
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
    return buildSession(params.token, params.expiresAt, params.mockProvider ?? 'local')
  },

  async refreshSession(session) {
    return buildSession(session.token, session.expiresAt, session.user?.authProvider ?? 'local')
  },
}

export const authService = env.useMocks ? mock : api
