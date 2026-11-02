import { axiosClient } from '../api/axiosClient'
import { env } from '../config/env'
import { toUser } from './mappers'
import * as mock from './mock/usersMock'

// Usuarios (HU-SE-01) - Conectado con UserController
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

  // GET /api/users/{id}/detail
  async getDetail(id) {
    const { data } = await axiosClient.get(`/users/${id}/detail`)
    return toUser(data)
  },

  // GET /api/users/{id}/detail-with-roles
  async getWithRoles(id) {
    const { data } = await axiosClient.get(`/users/${id}/detail-with-roles`)
    return data
  },

  // GET /api/users/available-for-role/{roleId} (o fallback filtrando /users y /user-roles)
  async listAvailableForRole(roleId) {
    try {
      const { data } = await axiosClient.get(`/users/available-for-role/${roleId}`)
      return data.map(toUser)
    } catch {
      const [{ data: users }, { data: assigned }] = await Promise.all([
        axiosClient.get('/users'),
        axiosClient.get(`/user-roles/roles/${roleId}`),
      ])
      const assignedIds = new Set(assigned.map((roleUser) => roleUser.user?.id ?? roleUser.userId))
      return users.map(toUser).filter((user) => !assignedIds.has(user.id))
    }
  },

  // POST /api/users { name, email, password }
  async create({ name, email, password }) {
    const { data } = await axiosClient.post('/users', { name, email, password })
    return toUser(data)
  },

  // PUT /api/users/{id} { name, email, password? }
  async update(id, { name, email, password }) {
    const body = {
      name,
      email,
      ...(password ? { password } : {}),
    }
    const { data } = await axiosClient.put(`/users/${id}`, body)
    return toUser(data)
  },

  // PUT /api/users/{id}/status { active }
  async setActive(id, active) {
    try {
      const { data } = await axiosClient.put(`/users/${id}/status`, { active })
      return toUser(data)
    } catch {
      const { data } = await axiosClient.patch(`/users/${id}/status`, { active })
      return toUser(data)
    }
  },

  // DELETE /api/users/{id}
  async remove(id) {
    await axiosClient.delete(`/users/${id}`)
  },
}

export const usersService = env.useMocks ? mock : api
