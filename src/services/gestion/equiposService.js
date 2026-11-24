import { gestionClient } from '../../api/gestionClient'
import { env } from '../../config/env'
import { unwrapApiData } from '../../dtos'
import * as mock from '../mock/gestion/equiposMock'

const api = {
  async list(params = {}) {
    const { data } = await gestionClient.get('/equipos', { params })
    return unwrapApiData(data)
  },
  async get(id) {
    const { data } = await gestionClient.get(`/equipos/${id}`)
    return unwrapApiData(data)
  },
  async create(payload) {
    const { data } = await gestionClient.post('/equipos', payload)
    return unwrapApiData(data)
  },
  async update(id, payload) {
    const { data } = await gestionClient.put(`/equipos/${id}`, payload)
    return unwrapApiData(data)
  },
  async changeStatus(id, activo) {
    const { data } = await gestionClient.patch(`/equipos/${id}/estado`, { activo })
    return unwrapApiData(data)
  },
  async remove(id) {
    await gestionClient.delete(`/equipos/${id}`)
  },
  async getSports(teamId) {
    const { data } = await gestionClient.get(`/equipos/${teamId}/deportes`)
    return unwrapApiData(data)
  },
  async getBySport(deporteId) {
    const { data } = await gestionClient.get(`/deportes/${deporteId}/equipos`)
    return unwrapApiData(data)
  },
  async assignSport(teamId, deporteId) {
    const { data } = await gestionClient.post(`/equipos/${teamId}/deportes`, { deporteId })
    return unwrapApiData(data)
  },
  async removeSport(teamId, deporteId) {
    await gestionClient.delete(`/equipos/${teamId}/deportes/${deporteId}`)
  },
  async getTournaments(teamId) {
    const { data } = await gestionClient.get(`/equipos/${teamId}/torneos`)
    return unwrapApiData(data)
  },
}

export const equiposService = env.useMocks ? mock : api
