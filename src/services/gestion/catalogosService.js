import { gestionClient } from '../../api/gestionClient'
import { env } from '../../config/env'
import { unwrapApiData } from '../../dtos'
import * as mock from '../mock/gestion/catalogosMock'

const api = {
  async getSports(params = {}) {
    const { data } = await gestionClient.get('/deportes', { params })
    return unwrapApiData(data)
  },
  async getVenues() {
    const { data } = await gestionClient.get('/escenarios')
    return unwrapApiData(data)
  },
}

export const catalogosService = env.useMocks ? mock : api
