import { normalizeText } from '../../../utils/format'
import { clone, delay, notFound } from '../mockHttp'
import { getHabilidadesAsignadasSync, MOCK_JUGADORES } from './habilidadJugadorMock'

const CONTRATOS_POR_JUGADOR = {
  7: {
    equiposActuales: [
      {
        equipo: { id: 4, nombre: 'Atlético Manizales', activo: true },
        fechaInicio: '2026-01-15',
        fechaFin: '2027-12-31',
      },
    ],
    historialEquipos: [
      {
        equipo: { id: 9, nombre: 'Deportivo Caldas', activo: true },
        fechaInicio: '2024-01-10',
        fechaFin: '2025-12-31',
        fechaRetiro: '2025-12-20',
      },
      {
        equipo: { id: 12, nombre: 'Real Andino', activo: true },
        fechaInicio: '2022-02-01',
        fechaFin: '2023-12-31',
        fechaRetiro: '2023-11-30',
      },
    ],
  },
  8: {
    equiposActuales: [],
    historialEquipos: [],
  },
  9: {
    equiposActuales: [],
    historialEquipos: [
      {
        equipo: { id: 4, nombre: 'Once Caldas', activo: true },
        fechaInicio: '2023-01-01',
        fechaFin: '2024-12-31',
        fechaRetiro: '2024-08-15',
      },
    ],
  },
}

export async function buscarJugadores(busqueda = '', activo) {
  await delay(150)
  const term = normalizeText(busqueda.trim())

  const resultados = MOCK_JUGADORES.filter((jugador) => {
    const matchActivo = activo === undefined || activo === null ? true : jugador.activo === activo
    const matchTerm =
      !term ||
      normalizeText(jugador.nombreCompleto).includes(term) ||
      normalizeText(jugador.numeroDocumento).includes(term) ||
      normalizeText(jugador.email ?? '').includes(term)
    return matchActivo && matchTerm
  })

  return clone(resultados)
}

export async function obtenerPerfil(jugadorId) {
  await delay(200)
  const id = Number(jugadorId)
  const jugador = MOCK_JUGADORES.find((item) => item.id === id)
  if (!jugador) {
    throw notFound(`No existe el jugador con id ${id}.`)
  }

  const contratos = CONTRATOS_POR_JUGADOR[id] ?? { equiposActuales: [], historialEquipos: [] }
  const habilidades = getHabilidadesAsignadasSync(id)
  const tieneEquipos = contratos.equiposActuales.length > 0
  const tieneHabilidades = habilidades.length > 0

  const mensajes = []
  if (!tieneEquipos) {
    mensajes.push('El jugador no tiene equipos asociados')
  }
  if (!tieneHabilidades) {
    mensajes.push('El jugador no tiene habilidades registradas')
  }

  return clone({
    jugador: {
      id: jugador.id,
      tipoDocumento: jugador.tipoDocumento,
      numeroDocumento: jugador.numeroDocumento,
      nombreCompleto: jugador.nombreCompleto,
      fechaNacimiento: jugador.fechaNacimiento,
      edad: jugador.edad,
      email: jugador.email,
      telefono: jugador.telefono,
      activo: jugador.activo,
    },
    equiposActuales: contratos.equiposActuales,
    historialEquipos: contratos.historialEquipos,
    habilidades,
    tieneEquipos,
    tieneHabilidades,
    mensajes,
  })
}
