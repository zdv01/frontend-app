import { gestionClient } from '../../api/gestionClient'
import { env } from '../../config/env'
import * as mock from '../mock/gestion/fasesMock'

const api = {
  async obtenerFaseFinal(torneoId) {
    const { data } = await gestionClient.get(`/torneos/${torneoId}/fase-final`)
    return data
  },

  async crearFaseFinal(torneoId, payload) {
    const { data } = await gestionClient.post(`/torneos/${torneoId}/fase-final`, payload)
    return data
  },

  async actualizarFaseFinal(faseFinalId, payload) {
    const { data } = await gestionClient.put(`/fases-finales/${faseFinalId}`, payload)
    return data
  },

  async eliminarFaseFinal(faseFinalId) {
    await gestionClient.delete(`/fases-finales/${faseFinalId}`)
  },

  async obtenerLlaves(faseFinalId) {
    const { data } = await gestionClient.get(`/fases-finales/${faseFinalId}/llaves`)
    return data
  },
}

export const fasesService = env.useMocks ? mock : api
