import { gestionClient } from '../../api/gestionClient'
import { env } from '../../config/env'
import * as mock from '../mock/gestion/perfilMock'

const api = {
  async buscarJugadores(busqueda = '', activo) {
    const params = {}
    if (busqueda.trim()) params.busqueda = busqueda.trim()
    if (activo !== undefined && activo !== null) params.activo = activo
    const { data } = await gestionClient.get('/jugadores', { params })
    return data
  },

  async obtenerPerfil(jugadorId) {
    const { data } = await gestionClient.get(`/jugadores/${jugadorId}/perfil`)
    return data
  },
}

export const perfilService = env.useMocks ? mock : api
