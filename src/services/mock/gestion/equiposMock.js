let teams = [
  { id: 4, nombre: 'Once Caldas', ciudad: 'Manizales', fechaFundacion: '1961-01-16', descripcion: 'Club deportivo', activo: true, fechaCreacion: '2026-11-20T10:00:00' },
  { id: 9, nombre: 'Deportes Pereira', ciudad: 'Pereira', fechaFundacion: '1944-04-12', descripcion: '', activo: true, fechaCreacion: '2026-11-20T10:00:00' },
]
const sportsByTeam = { 4: [{ id: 1, nombre: 'Fútbol', activo: true }], 9: [{ id: 1, nombre: 'Fútbol', activo: true }] }

export async function list() { return teams }
export async function get(id) { return teams.find((team) => team.id === Number(id)) }
export async function create(payload) {
  const team = { id: Math.max(0, ...teams.map((item) => item.id)) + 1, activo: true, fechaCreacion: new Date().toISOString(), ...payload }
  teams = [...teams, team]
  return team
}
export async function update(id, payload) {
  teams = teams.map((team) => team.id === Number(id) ? { ...team, ...payload } : team)
  return teams.find((team) => team.id === Number(id))
}
export async function changeStatus(id, activo) { return update(id, { activo }) }
export async function remove(id) { teams = teams.filter((team) => team.id !== Number(id)) }
export async function getSports(teamId) { return sportsByTeam[teamId] ?? [] }
export async function getBySport(deporteId) {
  return teams.filter((team) =>
    (sportsByTeam[team.id] ?? []).some((sport) => sport.id === Number(deporteId)),
  )
}
export async function assignSport(teamId, deporteId) {
  const sport = { id: deporteId, nombre: deporteId === 1 ? 'Fútbol' : 'Baloncesto', activo: true }
  sportsByTeam[teamId] = [...(sportsByTeam[teamId] ?? []).filter((item) => item.id !== deporteId), sport]
  return sport
}
export async function removeSport(teamId, deporteId) {
  sportsByTeam[teamId] = (sportsByTeam[teamId] ?? []).filter((item) => item.id !== deporteId)
}
export async function getTournaments(teamId) {
  return teamId === 4
    ? [{ id: 30, torneo: { id: 1, nombre: 'Copa Caldas 2026', estado: 'INSCRIPCIONES_ABIERTAS' }, equipo: { id: 4, nombre: 'Once Caldas', activo: true }, fechaInscripcion: '2026-11-20T10:00:00' }]
    : []
}
