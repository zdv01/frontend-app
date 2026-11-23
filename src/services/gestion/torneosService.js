import { gestionClient } from '../../api/gestionClient'
import { env } from '../../config/env'
import { unwrapApiData } from '../../dtos'
import * as mock from '../mock/gestion/torneosMock'

const api = {
  async list(params = {}) {
    const { data } = await gestionClient.get('/torneos', { params })
    return unwrapApiData(data)
  },
  async get(id) {
    const { data } = await gestionClient.get(`/torneos/${id}`)
    return unwrapApiData(data)
  },
  async create(payload) {
    const { data } = await gestionClient.post('/torneos', payload)
    return unwrapApiData(data)
  },
  async update(id, payload) {
    const { data } = await gestionClient.put(`/torneos/${id}`, payload)
    return unwrapApiData(data)
  },
  async changeStatus(id, estado) {
    const { data } = await gestionClient.patch(`/torneos/${id}/estado`, { estado })
    return unwrapApiData(data)
  },
  async remove(id) {
    await gestionClient.delete(`/torneos/${id}`)
  },
  async getInscriptions(tournamentId) {
    const { data } = await gestionClient.get(`/torneos/${tournamentId}/inscripciones`)
    return unwrapApiData(data)
  },
  async enrollTeams(tournamentId, equipoIds) {
    const { data } = await gestionClient.post(`/torneos/${tournamentId}/inscripciones`, { equipoIds })
    return unwrapApiData(data)
  },
  async removeEnrollment(tournamentId, teamId) {
    await gestionClient.delete(`/torneos/${tournamentId}/inscripciones/${teamId}`)
  },
}

export const torneosService = env.useMocks ? mock : api
