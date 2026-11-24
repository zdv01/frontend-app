import { gestionClient } from '../../api/gestionClient'
import { env } from '../../config/env'
import { unwrapApiData } from '../../dtos'
import * as mock from '../mock/gestion/partidosMock'

// Partidos (9.10), resultado y anotaciones (9.11). Para el formulario también se leen
// las fases de un torneo (9.14) y los equipos de un grupo (9.15), solo lectura.
const api = {
  async list(params = {}) {
    const query = {}
    if (params.torneoId) query.torneoId = params.torneoId
    if (params.equipoId) query.equipoId = params.equipoId
    if (params.estado) query.estado = params.estado
    const { data } = await gestionClient.get('/partidos', { params: query })
    return unwrapApiData(data)
  },
  async listByFase(faseId, estado) {
    const { data } = await gestionClient.get(`/fases/${faseId}/partidos`, { params: estado ? { estado } : {} })
    return unwrapApiData(data)
  },
  async get(id) {
    const { data } = await gestionClient.get(`/partidos/${id}`)
    return unwrapApiData(data)
  },
  async create(faseId, payload) {
    const { data } = await gestionClient.post(`/fases/${faseId}/partidos`, payload)
    return unwrapApiData(data)
  },
  async update(id, payload) {
    const { data } = await gestionClient.put(`/partidos/${id}`, payload)
    return unwrapApiData(data)
  },
  async changeStatus(id, estado) {
    const { data } = await gestionClient.patch(`/partidos/${id}/estado`, { estado })
    return unwrapApiData(data)
  },
  async remove(id) {
    await gestionClient.delete(`/partidos/${id}`)
  },
  async setResultado(id, payload) {
    const { data } = await gestionClient.put(`/partidos/${id}/resultado`, payload)
    return unwrapApiData(data)
  },
  async listAnotaciones(partidoId) {
    const { data } = await gestionClient.get(`/partidos/${partidoId}/anotaciones`)
    return unwrapApiData(data)
  },
  async createAnotacion(partidoId, payload) {
    const { data } = await gestionClient.post(`/partidos/${partidoId}/anotaciones`, payload)
    return unwrapApiData(data)
  },
  async updateAnotacion(id, payload) {
    const { data } = await gestionClient.put(`/anotaciones/${id}`, payload)
    return unwrapApiData(data)
  },
  async removeAnotacion(id) {
    await gestionClient.delete(`/anotaciones/${id}`)
  },
  async listFases(torneoId) {
    const { data } = await gestionClient.get(`/torneos/${torneoId}/fases`)
    return unwrapApiData(data)
  },
  async listEquiposGrupo(grupoId) {
    const { data } = await gestionClient.get(`/grupos/${grupoId}/equipos`)
    return unwrapApiData(data)
  },
}

export const partidosService = env.useMocks ? mock : api
