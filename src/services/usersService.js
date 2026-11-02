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

  // PUT /api/users/{id}/status { active }.
  async setActive(id, active) {
    const { data } = await axiosClient.put(`/users/${id}/status`, { active })
    return toUser(data)
  },

  async listAvailableForRole(roleId) {
    const [{ data: users }, { data: assigned }] = await Promise.all([
      axiosClient.get('/users'),
      axiosClient.get(`/user-roles/roles/${roleId}`),
    ])
    const assignedIds = new Set(assigned.map((roleUser) => roleUser.user?.id))
    return users.map(toUser).filter((user) => !assignedIds.has(user.id))
  },
}

export const usersService = env.useMocks ? mock : api
