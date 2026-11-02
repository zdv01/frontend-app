import { axiosClient } from '../api/axiosClient'
import { env } from '../config/env'
import { toPermission, toPermissionPayload } from './mappers'
import * as mock from './mock/permissionsMock'

// Permisos (HU-SE-05). El backend persiste url, method y model.
const api = {
  // GET /api/permissions
  async list() {
    const { data } = await axiosClient.get('/permissions')
    return data.map(toPermission)
  },

  // POST /api/permissions { url, method, model } (+ resource, operation, active propuestos)
  async create(permission) {
    const { data } = await axiosClient.post('/permissions', toPermissionPayload(permission))
    return toPermission(data)
  },

  // PUT /api/permissions/{id}
  async update(id, permission) {
    const { data } = await axiosClient.put(`/permissions/${id}`, toPermissionPayload(permission))
    return toPermission(data)
  },

  // DELETE /api/permissions/{id}
  async remove(id) {
    await axiosClient.delete(`/permissions/${id}`)
  },
}

export const permissionsService = env.useMocks ? mock : api
