let tournaments = [
  { id: 1, nombre: 'Copa Caldas 2026', deporte: { id: 1, nombre: 'Fútbol', activo: true }, descripcion: 'Torneo departamental', fechaInicio: '2026-12-01', fechaFin: '2026-12-20', fechaCierreInscripciones: '2026-11-28', maxEquipos: 8, estado: 'INSCRIPCIONES_ABIERTAS', inscripcionesAbiertas: true, cantidadInscritos: 1, fechaCreacion: '2026-11-20T10:00:00' },
]
const inscriptions = { 1: [{ id: 30, torneo: { id: 1, nombre: 'Copa Caldas 2026', estado: 'INSCRIPCIONES_ABIERTAS' }, equipo: { id: 4, nombre: 'Once Caldas', activo: true }, fechaInscripcion: '2026-11-20T10:00:00' }] }

export async function list() { return tournaments }
export async function get(id) { return tournaments.find((item) => item.id === Number(id)) }
export async function create(payload) {
  const tournament = { id: Math.max(0, ...tournaments.map((item) => item.id)) + 1, estado: 'INSCRIPCIONES_ABIERTAS', inscripcionesAbiertas: true, cantidadInscritos: 0, fechaCreacion: new Date().toISOString(), deporte: { id: payload.deporteId, nombre: payload.deporteId === 1 ? 'Fútbol' : 'Baloncesto', activo: true }, ...payload }
  tournaments = [...tournaments, tournament]
  return tournament
}
export async function update(id, payload) {
  tournaments = tournaments.map((item) => item.id === Number(id) ? { ...item, ...payload } : item)
  return tournaments.find((item) => item.id === Number(id))
}
export async function changeStatus(id, estado) { return update(id, { estado, inscripcionesAbiertas: estado === 'INSCRIPCIONES_ABIERTAS' }) }
export async function remove(id) { tournaments = tournaments.filter((item) => item.id !== Number(id)) }
export async function getInscriptions(id) { return inscriptions[id] ?? [] }
export async function enrollTeams(id, equipoIds) { return equipoIds.map((equipoId) => ({ id: equipoId + 100, torneo: { id: Number(id), nombre: 'Copa Caldas 2026', estado: 'INSCRIPCIONES_ABIERTAS' }, equipo: { id: equipoId, nombre: equipoId === 4 ? 'Once Caldas' : 'Deportes Pereira', activo: true }, fechaInscripcion: new Date().toISOString() })) }
export async function removeEnrollment(id, equipoId) { inscriptions[id] = (inscriptions[id] ?? []).filter((item) => item.equipo.id !== equipoId) }
