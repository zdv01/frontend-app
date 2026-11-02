import { axiosClient } from '../api/axiosClient'
import { env } from '../config/env'
import { toRole } from './mappers'
import * as mock from './mock/rolesMock'

// Roles (HU-SE-03) - Conectado con RoleController
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

  // GET /api/roles/{id}/detail-with-permissions
  async getWithPermissions(id) {
    const { data } = await axiosClient.get(`/roles/${id}/detail-with-permissions`)
    return {
      ...toRole(data),
      permissions: data.permissions ?? [],
    }
  },

  // POST /api/roles { name, description }
  async create(role) {
    const payload = {
      name: (role.name ?? '').trim(),
      description: (role.description ?? '').trim(),
    }
    const { data } = await axiosClient.post('/roles', payload)
    return toRole(data)
  },

  // PUT /api/roles/{id} { name, description }
  async update(id, role) {
    const payload = {
      name: (role.name ?? '').trim(),
      description: (role.description ?? '').trim(),
    }
    const { data } = await axiosClient.put(`/roles/${id}`, payload)
    return toRole(data)
  },

  // DELETE /api/roles/{id} → 409 si tiene usuarios asignados
  async remove(id) {
    await axiosClient.delete(`/roles/${id}`)
  },
}

export const rolesService = env.useMocks ? mock : api
