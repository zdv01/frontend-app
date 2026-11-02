import { axiosClient } from '../api/axiosClient'
import { env } from '../config/env'
import { toUser } from './mappers'
import * as mock from './mock/usersMock'

// Usuarios (HU-SE-01)
const api = {
  // GET /api/users
  async list() {
    const { data } = await axiosClient.get('/users')
    return data.map(toUser)
  },

  // GET /api/users/{id}
  async get(id) {
    const { data } = await axiosClient.get(`/users/${id}`)
    return toUser(data)
  },

  // POST /api/users { name, email, password }
  async create({ name, email, password }) {
    const { data } = await axiosClient.post('/users', { name, email, password })
    return toUser(data)
  },

  // PUT /api/users/{id} { name, email, password?, enabled? }
  async update(id, { name, email, password, enabled }) {
    const body = {
      name,
      email,
      ...(password ? { password } : {}),
      ...(typeof enabled === 'boolean' ? { enabled } : {}),
    }
    const { data } = await axiosClient.put(`/users/${id}`, body)
    return toUser(data)
  },

  // El backend desactiva con DELETE y reactiva con PUT { enabled: true }.
  async setActive(id, active) {
    if (!active) {
      await axiosClient.delete(`/users/${id}`)
      return { ...(await api.get(id)), active: false }
    }
    const user = await api.get(id)
    return api.update(id, { ...user, enabled: true })
  },

  async listAvailableForRole(roleId) {
    const { data } = await axiosClient.get(`/users/available-for-role/${roleId}`)
    return data.map(toUser)
  },
}

export const usersService = env.useMocks ? mock : api
