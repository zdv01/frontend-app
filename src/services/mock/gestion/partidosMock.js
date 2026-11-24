import { clone, conflict, delay, httpError, notFound } from '../mockHttp'

const torneo = { id: 1, nombre: 'Copa Caldas 2026', estado: 'EN_CURSO' }
const fases = [
  { id: 3, torneo, nombre: 'Grupo A', tipo: 'GRUPO', orden: 1, cantidadEquipos: 2, tercerPuesto: null, cantidadPartidos: 1 },
  { id: 8, torneo, nombre: 'Fase final', tipo: 'FINAL', orden: 2, cantidadEquipos: 4, tercerPuesto: true, cantidadPartidos: 0 },
]
const equipos = [
  { id: 4, nombre: 'Once Caldas', activo: true },
  { id: 9, nombre: 'Deportes Pereira', activo: true },
]
const escenarios = [{ id: 1, nombre: 'Estadio Palogrande' }]
const jugador = { id: 7, tipoDocumento: 'CC', numeroDocumento: '1053000000', nombreCompleto: 'Juan Pérez', activo: true }

let partidos = [
  { id: 20, torneo, fase: { id: 3, nombre: 'Grupo A', tipo: 'GRUPO', orden: 1 }, equipoLocal: equipos[0], equipoVisitante: equipos[1], fechaHora: '2026-12-05T15:30:00', escenario: escenarios[0], ronda: null, numeroLlave: null, estado: 'EN_JUEGO', marcadorLocal: null, marcadorVisitante: null, tieneResultado: false, cantidadAnotaciones: 1 },
]
let anotaciones = [
  { id: 50, partidoId: 20, jugador, equipo: equipos[0], minuto: 34, valor: 1, descripcion: 'Gol de cabeza', fechaRegistro: '2026-12-05T16:05:00' },
]

const TRANSICIONES = { PROGRAMADO: ['EN_JUEGO', 'CANCELADO'], EN_JUEGO: ['FINALIZADO', 'CANCELADO'], FINALIZADO: [], CANCELADO: [] }
const invalid = (message) => httpError(400, 'INVALID_OPERATION', message)
const find = (id) => {
  const partido = partidos.find((p) => p.id === Number(id))
  if (!partido) throw notFound('El partido no existe.')
  return partido
}
const refresh = (partido) => ({
  ...partido,
  tieneResultado: partido.marcadorLocal !== null && partido.marcadorVisitante !== null,
  cantidadAnotaciones: anotaciones.filter((a) => a.partidoId === partido.id).length,
})
const patch = (id, changes) => {
  partidos = partidos.map((p) => (p.id === Number(id) ? refresh({ ...p, ...changes }) : p))
  return clone(partidos.find((p) => p.id === Number(id)))
}
const build = (faseId, payload) => {
  const fase = fases.find((f) => f.id === Number(faseId))
  if (!fase) throw notFound('La fase no existe.')
  if (payload.equipoLocalId === payload.equipoVisitanteId) throw invalid('Un equipo no puede competir contra sí mismo.')
  const team = (id) => equipos.find((e) => e.id === id) ?? { id, nombre: `Equipo ${id}`, activo: true }
  return {
    fase: { id: fase.id, nombre: fase.nombre, tipo: fase.tipo, orden: fase.orden },
    equipoLocal: team(payload.equipoLocalId),
    equipoVisitante: team(payload.equipoVisitanteId),
    fechaHora: payload.fechaHora,
    escenario: escenarios.find((e) => e.id === payload.escenarioId) ?? null,
    ronda: payload.ronda ?? null,
    numeroLlave: payload.numeroLlave ?? null,
  }
}

export async function list({ torneoId, equipoId, estado } = {}) {
  await delay()
  return clone(partidos.filter((p) => (!torneoId || p.torneo.id === Number(torneoId)) && (!equipoId || p.equipoLocal.id === Number(equipoId) || p.equipoVisitante.id === Number(equipoId)) && (!estado || p.estado === estado)))
}
export async function listByFase(faseId, estado) {
  await delay()
  return clone(partidos.filter((p) => p.fase.id === Number(faseId) && (!estado || p.estado === estado)))
}
export async function get(id) { await delay(); return clone(find(id)) }
export async function create(faseId, payload) {
  await delay()
  const partido = refresh({ id: Math.max(0, ...partidos.map((p) => p.id)) + 1, torneo, estado: 'PROGRAMADO', marcadorLocal: null, marcadorVisitante: null, ...build(faseId, payload) })
  partidos = [...partidos, partido]
  return clone(partido)
}
export async function update(id, payload) {
  await delay()
  const actual = find(id)
  if (actual.estado !== 'PROGRAMADO') throw invalid('Solo se puede editar un partido PROGRAMADO.')
  return patch(id, build(actual.fase.id, payload))
}
export async function changeStatus(id, estado) {
  await delay()
  const actual = find(id)
  if (!TRANSICIONES[actual.estado].includes(estado)) throw invalid(`No se puede pasar de ${actual.estado} a ${estado}.`)
  if (estado === 'FINALIZADO' && !actual.tieneResultado) throw invalid('Registra el resultado antes de finalizar el partido.')
  return patch(id, { estado })
}
export async function remove(id) {
  await delay()
  const actual = find(id)
  if (actual.estado !== 'PROGRAMADO' || actual.cantidadAnotaciones > 0) throw conflict('Solo se puede eliminar un partido PROGRAMADO sin anotaciones.', 'HAS_ASSOCIATIONS')
  partidos = partidos.filter((p) => p.id !== actual.id)
}
export async function setResultado(id, { marcadorLocal, marcadorVisitante }) {
  await delay()
  const actual = find(id)
  if (!['EN_JUEGO', 'FINALIZADO'].includes(actual.estado)) throw invalid('El resultado solo se registra en un partido EN_JUEGO o FINALIZADO.')
  return patch(id, { marcadorLocal, marcadorVisitante })
}
export async function listAnotaciones(partidoId) {
  await delay()
  return clone(anotaciones.filter((a) => a.partidoId === Number(partidoId)).sort((a, b) => (a.minuto ?? 999) - (b.minuto ?? 999)))
}
export async function createAnotacion(partidoId, payload) {
  await delay()
  const partido = find(partidoId)
  if (!['EN_JUEGO', 'FINALIZADO'].includes(partido.estado)) throw invalid('Solo se registran anotaciones en partidos EN_JUEGO o FINALIZADO.')
  const anotacion = { id: Math.max(0, ...anotaciones.map((a) => a.id)) + 1, partidoId: partido.id, jugador: { ...jugador, id: payload.jugadorId }, equipo: partido.equipoLocal, minuto: payload.minuto ?? null, valor: payload.valor ?? 1, descripcion: payload.descripcion ?? null, fechaRegistro: new Date().toISOString().slice(0, 19) }
  anotaciones = [...anotaciones, anotacion]
  patch(partido.id, {})
  return clone(anotacion)
}
export async function updateAnotacion(id, payload) {
  await delay()
  anotaciones = anotaciones.map((a) => (a.id === Number(id) ? { ...a, minuto: payload.minuto ?? null, valor: payload.valor ?? 1, descripcion: payload.descripcion ?? null, jugador: { ...a.jugador, id: payload.jugadorId } } : a))
  return clone(anotaciones.find((a) => a.id === Number(id)))
}
export async function removeAnotacion(id) {
  await delay()
  const anotacion = anotaciones.find((a) => a.id === Number(id))
  anotaciones = anotaciones.filter((a) => a.id !== Number(id))
  if (anotacion) patch(anotacion.partidoId, {})
}
export async function listFases(torneoId) { await delay(); return clone(fases.filter((f) => f.torneo.id === Number(torneoId))) }
export async function listEquiposGrupo() { await delay(); return clone(equipos) }
