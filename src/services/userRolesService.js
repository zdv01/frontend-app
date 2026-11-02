import { axiosClient } from '../api/axiosClient'
import { env } from '../config/env'
import { toRole, toUser } from './mappers'
import * as mock from './mock/userRolesMock'

// Asignación de roles a usuarios (HU-SE-04) - Conectado con UserRoleController
const api = {
  // GET /api/user-roles
  async list() {
    const { data } = await axiosClient.get('/user-roles')
    return data
  },

  // GET /api/user-roles/users/{userId} → [{ id, userId, role }]
  async listRolesByUser(userId) {
    const { data } = await axiosClient.get(`/user-roles/users/${userId}`)
    return data.map((userRole) => toRole(userRole.role))
  },

  // GET /api/user-roles/roles/{roleId} → [{ id, roleId, user }]
  async listUsersByRole(roleId) {
    const { data } = await axiosClient.get(`/user-roles/roles/${roleId}`)
    return data.map((roleUser) => toUser(roleUser.user))
  },

  // GET /api/user-roles/roles/{roleId}/available-users → [{ id, name, email }]
  async listAvailableUsersByRole(roleId) {
    const { data } = await axiosClient.get(`/user-roles/roles/${roleId}/available-users`)
    return data.map(toUser)
  },

  // POST /api/user-roles { userId, roleId }
  async assign(userId, roleId) {
    const { data } = await axiosClient.post('/user-roles', { userId, roleId })
    return data
  },

  // DELETE /api/user-roles/{userId}/{roleId}
  async remove(userId, roleId) {
    await axiosClient.delete(`/user-roles/${userId}/${roleId}`)
  },
}

export const userRolesService = env.useMocks ? mock : api
