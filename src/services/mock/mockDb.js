import { buildSeed } from './mockData'

/*
 * "Base de datos" del modo de prueba. Vive en memoria y se copia a localStorage
 * para que los cambios sobrevivan a recargar la página o cerrar sesión.
 * Para volver a los datos iniciales: resetMockDb() o borrar la clave en el navegador.
 */
const STORAGE_KEY = 'sportmanager.mockdb.v1'

let db = null

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export function getDb() {
  if (!db) {
    db = load() ?? buildSeed()
    saveDb()
  }
  return db
}

export function saveDb() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Sin localStorage (modo privado, etc.) los datos solo duran mientras la pestaña esté abierta
  }
}

export function resetMockDb() {
  db = buildSeed()
  saveDb()
}

export function nextId(items) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

export function findUserByEmail(email) {
  const normalized = email.trim().toLowerCase()
  return getDb().users.find((user) => user.email.toLowerCase() === normalized)
}
