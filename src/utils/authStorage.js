// Guarda la sesión en localStorage para que sobreviva a recargar la página.
const STORAGE_KEY = 'sportmanager.session'

export function saveSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

// Devuelve la sesión guardada, o null si no hay o si ya expiró
export function loadSession() {
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!session || isExpired(session.expiresAt)) {
      clearSession()
      return null
    }
    return session
  } catch {
    clearSession()
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
}

export function getToken() {
  return loadSession()?.token ?? null
}

export function isExpired(expiresAt) {
  return !expiresAt || new Date(expiresAt).getTime() <= Date.now()
}
