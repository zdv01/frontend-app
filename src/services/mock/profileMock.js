import { getDb, saveDb } from './mockDb'
import { clone, conflict, delay, notFound } from './mockHttp'

// Devuelve el perfil o null si el usuario todavía no tiene uno
export async function get(userId) {
  await delay()
  const profile = getDb().profiles.find((p) => p.userId === Number(userId))
  return profile ? clone(profile) : null
}

// Cada usuario tiene como máximo un perfil: se crea o se actualiza
export async function save(userId, { phone, birthDate, photo, photoUrl }) {
  await delay()
  const db = getDb()
  const id = Number(userId)
  if (!db.users.some((u) => u.id === id)) throw notFound('Usuario no encontrado')
  let profile = db.profiles.find((p) => p.userId === id)
  if (!profile) {
    profile = { userId: id }
    db.profiles.push(profile)
  }
  Object.assign(profile, { phone: phone.trim(), birthDate, photo: photoUrl ?? photo ?? null })
  saveDb()
  return clone(profile)
}

export async function setTwoFactor(userId, enabled) {
  await delay()
  const user = getDb().users.find((u) => u.id === Number(userId))
  if (!user) throw notFound('Usuario no encontrado')
  if (user.authProvider !== 'local') {
    throw conflict(
      'La verificación en dos pasos solo aplica a cuentas con correo y contraseña.',
      'INVALID_OPERATION',
    )
  }
  user.twoFactorEnabled = enabled
  saveDb()
  return { twoFactorEnabled: enabled }
}
