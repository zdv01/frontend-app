import { gestionClient } from '../../api/gestionClient'
import { env } from '../../config/env'
import { unwrapApiData } from '../../dtos'
import * as mock from '../mock/gestion/jugadoresMock'

// Jugadores (9.7) y contratos equipo-jugador (9.8)
const api = {
  async list(params = {}) {
    const query = {}
    if (params.busqueda) query.busqueda = params.busqueda
    if (typeof params.activo === 'boolean') query.activo = params.activo
    const { data } = await gestionClient.get('/jugadores', { params: query })
    return unwrapApiData(data)
  },
  async get(id) {
    const { data } = await gestionClient.get(`/jugadores/${id}`)
    return unwrapApiData(data)
  },
  async create(payload) {
    const { data } = await gestionClient.post('/jugadores', payload)
    return unwrapApiData(data)
  },
  async update(id, payload) {
    const { data } = await gestionClient.put(`/jugadores/${id}`, payload)
    return unwrapApiData(data)
  },
  async changeStatus(id, activo) {
    const { data } = await gestionClient.patch(`/jugadores/${id}/estado`, { activo })
    return unwrapApiData(data)
  },
  async remove(id) {
    await gestionClient.delete(`/jugadores/${id}`)
  },
  async listContratosEquipo(equipoId, incluirHistorial = false) {
    const { data } = await gestionClient.get(`/equipos/${equipoId}/jugadores`, { params: { incluirHistorial } })
    return unwrapApiData(data)
  },
  async listContratosJugador(jugadorId, incluirHistorial = false) {
    const { data } = await gestionClient.get(`/jugadores/${jugadorId}/equipos`, { params: { incluirHistorial } })
    return unwrapApiData(data)
  },
  async asignar(equipoId, payload) {
    const { data } = await gestionClient.post(`/equipos/${equipoId}/jugadores`, payload)
    return unwrapApiData(data)
  },
  async retirar(equipoId, jugadorId, fechaRetiro) {
    const body = fechaRetiro ? { fechaRetiro } : {}
    const { data } = await gestionClient.patch(`/equipos/${equipoId}/jugadores/${jugadorId}/retiro`, body)
    return unwrapApiData(data)
  },
}

export const jugadoresService = env.useMocks ? mock : api
