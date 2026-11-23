import axios from 'axios'
import { env } from '../config/env'
import { clearSession, getToken } from '../utils/authStorage'
import { SESSION_EXPIRED_EVENT } from './axiosClient'

export const gestionClient = axios.create({
  baseURL: env.gestionApiUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

gestionClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

gestionClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession()
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
    return Promise.reject(error)
  },
)
