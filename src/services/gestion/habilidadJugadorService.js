import { gestionClient } from '../../api/gestionClient'
import { env } from '../../config/env'
import * as mock from '../mock/gestion/habilidadJugadorMock'

const api = {
  async listarCatalogoHabilidades(params = {}) {
    const query = {}
    if (params.nombre) query.nombre = params.nombre
    if (params.categoria) query.categoria = params.categoria
    const { data } = await gestionClient.get('/habilidades', { params: query })
    return data
  },

  async listarPorJugador(jugadorId) {
    const { data } = await gestionClient.get(`/jugadores/${jugadorId}/habilidades`)
    return data
  },

  async asignar(jugadorId, habilidadId) {
    const { data } = await gestionClient.post(`/jugadores/${jugadorId}/habilidades`, {
      habilidadId: Number(habilidadId),
    })
    return data
  },

  async retirar(jugadorId, habilidadId) {
    await gestionClient.delete(`/jugadores/${jugadorId}/habilidades/${habilidadId}`)
  },

  async listarJugadoresPorHabilidad(habilidadId) {
    const { data } = await gestionClient.get(`/habilidades/${habilidadId}/jugadores`)
    return data
  },
}

export const habilidadJugadorService = env.useMocks ? mock : api
