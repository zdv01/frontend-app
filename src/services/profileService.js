import { axiosClient } from '../api/axiosClient'
import { env } from '../config/env'
import { toProfile } from './mappers'
import * as mock from './mock/profileMock'

// Perfil de usuario (HU-SE-02) y activación de 2FA (HU-SE-10)
const api = {
  // GET /api/users/{userId}/profile → { id, phone, birthDate } — 404 si aún no tiene perfil
  async get(userId) {
    try {
      const { data } = await axiosClient.get(`/users/${userId}/profile`)
      return toProfile(data)
    } catch (error) {
      if (error.response?.status === 404) return null
      throw error
    }
  },

  // POST (crear) o PUT (actualizar) /api/users/{userId}/profile { phone, birthDate, photoUrl }
  async save(userId, profile, exists) {
    const request = exists ? axiosClient.put : axiosClient.post
    const payload = {
      phone: profile.phone,
      birthDate: profile.birthDate,
      photoUrl: profile.photoUrl ?? profile.photo ?? null,
    }
    const { data } = await request(`/users/${userId}/profile`, payload)
    return toProfile(data)
  },

  // PUT /api/auth/2fa { enabled } — siempre sobre el usuario autenticado
  async setTwoFactor(_userId, enabled) {
    const { data } = await axiosClient.put('/auth/2fa', { enabled })
    return { twoFactorEnabled: data?.twoFactorEnabled ?? enabled }
  },
}

export const profileService = env.useMocks ? mock : api
