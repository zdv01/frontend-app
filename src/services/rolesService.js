import { axiosClient } from '../api/axiosClient'
import { env } from '../config/env'
import { toRole } from './mappers'
import * as mock from './mock/rolesMock'

// Roles (HU-SE-03). El campo "active" es una propuesta para el backend.
const api = {
  // GET /api/roles
  async list() {
    const { data } = await axiosClient.get('/roles')
    return data.map(toRole)
  },

  // GET /api/roles/{id}
  async get(id) {
    const { data } = await axiosClient.get(`/roles/${id}`)
    return toRole(data)
  },

  // POST /api/roles { name, description, active }
  async create(role) {
    const { data } = await axiosClient.post('/roles', role)
    return toRole(data)
  },

  // PUT /api/roles/{id} { name, description, active }
  async update(id, role) {
    const { data } = await axiosClient.put(`/roles/${id}`, role)
    return toRole(data)
  },

  // DELETE /api/roles/{id} → 409 si tiene usuarios asignados
  async remove(id) {
    await axiosClient.delete(`/roles/${id}`)
  },
}

export const rolesService = env.useMocks ? mock : api
