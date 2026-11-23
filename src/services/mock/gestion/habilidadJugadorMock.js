import { normalizeText } from '../../../utils/format'
import { clone, conflict, delay, httpError, notFound } from '../mockHttp'

const CATALOGO_HABILIDADES = [
  {
    id: 1,
    nombre: 'Velocidad',
    descripcion: 'Acelera rápido y alcanza altas velocidades.',
    categoria: 'FISICA',
    fechaCreacion: '2026-10-01T09:00:00',
  },
  {
    id: 2,
    nombre: 'Regate',
    descripcion: 'Habilidad para eludir rivales con el balón.',
    categoria: 'TECNICA',
    fechaCreacion: '2026-10-01T09:05:00',
  },
  {
    id: 3,
    nombre: 'Definición',
    descripcion: 'Eficacia y precisión al finalizar jugadas.',
    categoria: 'TECNICA',
    fechaCreacion: '2026-10-01T09:10:00',
  },
  {
    id: 4,
    nombre: 'Resistencia',
    descripcion: 'Mantiene el rendimiento durante todo el partido.',
    categoria: 'FISICA',
    fechaCreacion: '2026-10-01T09:15:00',
  },
  {
    id: 5,
    nombre: 'Visión de juego',
    descripcion: 'Lee el juego y toma mejores decisiones en el campo.',
    categoria: 'TACTICA',
    fechaCreacion: '2026-10-01T09:20:00',
  },
  {
    id: 6,
    nombre: 'Liderazgo',
    descripcion: 'Influencia positiva y liderazgo dentro y fuera del campo.',
    categoria: 'MENTAL',
    fechaCreacion: '2026-10-01T09:25:00',
  },
]

export const MOCK_JUGADORES = [
  {
    id: 7,
    tipoDocumento: 'CC',
    numeroDocumento: '1053000000',
    nombres: 'Juan',
    apellidos: 'Pérez',
    nombreCompleto: 'Juan Pérez',
    fechaNacimiento: '2002-05-10',
    edad: 24,
    email: 'juan.perez@correo.com',
    telefono: '3001234567',
    activo: true,
    fechaCreacion: '2026-01-10T08:30:00',
  },
  {
    id: 8,
    tipoDocumento: 'TI',
    numeroDocumento: '1053999111',
    nombres: 'Mateo',
    apellidos: 'López',
    nombreCompleto: 'Mateo López',
    fechaNacimiento: '2008-09-14',
    edad: 18,
    email: 'mateo.lopez@correo.com',
    telefono: '3119876543',
    activo: true,
    fechaCreacion: '2026-03-22T14:15:00',
  },
  {
    id: 9,
    tipoDocumento: 'CC',
    numeroDocumento: '75098234',
    nombres: 'Carlos',
    apellidos: 'Duarte',
    nombreCompleto: 'Carlos Duarte',
    fechaNacimiento: '1995-11-02',
    edad: 31,
    email: 'carlos.duarte@correo.com',
    telefono: '3204567890',
    activo: false,
    fechaCreacion: '2025-07-05T11:00:00',
  },
]

const asignacionesPorJugador = {
  7: [1, 2, 3, 4],
  8: [],
  9: [5, 6],
}

function toResumen(habilidad) {
  return {
    id: habilidad.id,
    nombre: habilidad.nombre,
    categoria: habilidad.categoria,
  }
}

export function getHabilidadesAsignadasSync(jugadorId) {
  const ids = asignacionesPorJugador[Number(jugadorId)] ?? []
  return ids
    .map((id) => CATALOGO_HABILIDADES.find((item) => item.id === id))
    .filter(Boolean)
    .map(toResumen)
}

export async function listarCatalogoHabilidades(params = {}) {
  await delay(180)
  const nombre = normalizeText(params.nombre?.trim() ?? '')
  const categoria = params.categoria?.trim()?.toUpperCase() ?? ''

  const filtradas = CATALOGO_HABILIDADES.filter((item) => {
    const matchNombre = !nombre || normalizeText(item.nombre).includes(nombre)
    const matchCategoria = !categoria || item.categoria === categoria
    return matchNombre && matchCategoria
  })

  return clone(filtradas)
}

export async function listarPorJugador(jugadorId) {
  await delay(180)
  const id = Number(jugadorId)
  const jugador = MOCK_JUGADORES.find((item) => item.id === id)
  if (!jugador) {
    throw notFound(`No existe el jugador con id ${id}.`)
  }
  return clone(getHabilidadesAsignadasSync(id))
}

export async function asignar(jugadorId, habilidadId) {
  await delay(200)
  const jId = Number(jugadorId)
  const hId = Number(habilidadId)

  const jugador = MOCK_JUGADORES.find((item) => item.id === jId)
  if (!jugador) {
    throw notFound(`No existe el jugador con id ${jId}.`)
  }
  if (!jugador.activo) {
    throw httpError(
      400,
      'INVALID_OPERATION',
      'No se pueden asignar habilidades a un jugador inactivo.',
    )
  }

  const habilidad = CATALOGO_HABILIDADES.find((item) => item.id === hId)
  if (!habilidad) {
    throw notFound(`No existe la habilidad con id ${hId}.`)
  }

  const actuales = asignacionesPorJugador[jId] ?? []
  if (actuales.includes(hId)) {
    throw conflict('Esta habilidad ya se encuentra asignada al jugador.')
  }

  asignacionesPorJugador[jId] = [...actuales, hId]
  return clone(toResumen(habilidad))
}

export async function retirar(jugadorId, habilidadId) {
  await delay(200)
  const jId = Number(jugadorId)
  const hId = Number(habilidadId)

  const jugador = MOCK_JUGADORES.find((item) => item.id === jId)
  if (!jugador) {
    throw notFound(`No existe el jugador con id ${jId}.`)
  }

  const actuales = asignacionesPorJugador[jId] ?? []
  if (!actuales.includes(hId)) {
    throw notFound('El jugador no tiene asignada esta habilidad.')
  }

  asignacionesPorJugador[jId] = actuales.filter((id) => id !== hId)
}

export async function listarJugadoresPorHabilidad(habilidadId) {
  await delay(180)
  const hId = Number(habilidadId)
  const habilidad = CATALOGO_HABILIDADES.find((item) => item.id === hId)
  if (!habilidad) {
    throw notFound(`No existe la habilidad con id ${hId}.`)
  }

  const jugadores = MOCK_JUGADORES.filter((jugador) =>
    (asignacionesPorJugador[jugador.id] ?? []).includes(hId),
  ).map((jugador) => ({
    id: jugador.id,
    tipoDocumento: jugador.tipoDocumento,
    numeroDocumento: jugador.numeroDocumento,
    nombreCompleto: jugador.nombreCompleto,
    activo: jugador.activo,
  }))

  return clone(jugadores)
}
