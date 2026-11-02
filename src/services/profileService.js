import { axiosClient } from '../api/axiosClient'
import { env } from '../config/env'
import { toProfile } from './mappers'
import * as mock from './mock/profileMock'

// Perfil de usuario (HU-SE-02) y activación de 2FA (HU-SE-10)
const api = {
  // GET /api/profile/me devuelve UserDetailResponseDTO con el perfil anidado.
  async getMe() {
    const { data } = await axiosClient.get('/profile/me')
    return toProfile(data.profile)
  },

  // GET /api/users/{userId}/profile → UserDetailResponseDTO
  async get(userId) {
    try {
      const { data } = await axiosClient.get(`/users/${userId}/profile`)
      return toProfile(data.profile ?? data)
    } catch (error) {
      if (error.response?.status === 404) return null
      throw error
    }
  },

  // PUT /api/profile/me o POST/PUT /api/users/{userId}/profile
  async save(userId, profile, exists, own = false) {
    const payload = {
      phone: profile.phone,
      birthDate: profile.birthDate,
      photoUrl: profile.photoUrl ?? profile.photo ?? null,
    }
    if (own) {
      const { data } = await axiosClient.put('/profile/me', payload)
      return toProfile(data)
    }
    const request = exists ? axiosClient.put : axiosClient.post
    const { data } = await request(`/users/${userId}/profile`, payload)
    return toProfile(data)
  },

  // PUT /api/auth/2fa-settings { enabled } — siempre sobre el usuario autenticado
  async setTwoFactor(_userId, enabled) {
    await axiosClient.put('/auth/2fa-settings', { enabled })
    return { twoFactorEnabled: enabled }
  },
}

export const profileService = env.useMocks ? mock : api
