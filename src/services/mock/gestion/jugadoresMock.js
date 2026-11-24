let jugadores = [
  { id: 7, tipoDocumento: 'CC', numeroDocumento: '1053000000', nombres: 'Juan', apellidos: 'Pérez', nombreCompleto: 'Juan Pérez', fechaNacimiento: '2002-05-10', edad: 24, email: 'juan@correo.com', telefono: '3001234567', activo: true, fechaCreacion: '2026-11-20T10:00:00' },
]
let contratos = [
  { id: 15, jugador: { id: 7, tipoDocumento: 'CC', numeroDocumento: '1053000000', nombreCompleto: 'Juan Pérez', activo: true }, equipo: { id: 4, nombre: 'Once Caldas', activo: true }, fechaInicio: '2026-01-01', fechaFin: '2027-12-31', fechaRetiro: null, activo: true },
]
const full = (j) => ({ ...j, nombreCompleto: `${j.nombres} ${j.apellidos}` })

export async function list({ busqueda, activo } = {}) {
  const term = (busqueda ?? '').toLowerCase()
  return jugadores.filter((j) => (!term || `${j.nombres} ${j.apellidos} ${j.numeroDocumento}`.toLowerCase().includes(term)) && (typeof activo !== 'boolean' || j.activo === activo))
}
export async function get(id) { return jugadores.find((j) => j.id === Number(id)) }
export async function create(payload) {
  const j = full({ id: Math.max(0, ...jugadores.map((i) => i.id)) + 1, activo: true, edad: 20, fechaCreacion: new Date().toISOString(), ...payload })
  jugadores = [...jugadores, j]
  return j
}
export async function update(id, payload) {
  jugadores = jugadores.map((j) => (j.id === Number(id) ? full({ ...j, ...payload }) : j))
  return get(id)
}
export async function changeStatus(id, activo) { return update(id, { activo }) }
export async function remove(id) { jugadores = jugadores.filter((j) => j.id !== Number(id)) }
export async function listContratosEquipo(equipoId, incluirHistorial = false) {
  return contratos.filter((c) => c.equipo.id === Number(equipoId) && (incluirHistorial || c.activo))
}
export async function listContratosJugador(jugadorId, incluirHistorial = false) {
  return contratos.filter((c) => c.jugador.id === Number(jugadorId) && (incluirHistorial || c.activo))
}
export async function asignar(equipoId, { jugadorId, fechaInicio, fechaFin }) {
  const j = jugadores.find((i) => i.id === Number(jugadorId))
  const c = {
    id: Math.max(0, ...contratos.map((i) => i.id)) + 1,
    jugador: { id: j.id, tipoDocumento: j.tipoDocumento, numeroDocumento: j.numeroDocumento, nombreCompleto: j.nombreCompleto, activo: j.activo },
    equipo: { id: Number(equipoId), nombre: 'Equipo', activo: true },
    fechaInicio, fechaFin, fechaRetiro: null, activo: true,
  }
  contratos = [...contratos, c]
  return c
}
export async function retirar(equipoId, jugadorId, fechaRetiro) {
  const hoy = new Date().toISOString().slice(0, 10)
  contratos = contratos.map((c) => (c.equipo.id === Number(equipoId) && c.jugador.id === Number(jugadorId) && c.activo ? { ...c, activo: false, fechaRetiro: fechaRetiro || hoy } : c))
  return contratos.find((c) => c.equipo.id === Number(equipoId) && c.jugador.id === Number(jugadorId))
}
