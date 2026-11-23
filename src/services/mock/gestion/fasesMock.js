import { clone, conflict, delay, httpError, notFound } from '../mockHttp'

const CANTIDADES_VALIDAS = [2, 4, 8, 16, 32]

const RONDAS_POR_CANTIDAD = {
  32: ['DIECISEISAVOS', 'OCTAVOS', 'CUARTOS', 'SEMIFINAL', 'FINAL'],
  16: ['OCTAVOS', 'CUARTOS', 'SEMIFINAL', 'FINAL'],
  8: ['CUARTOS', 'SEMIFINAL', 'FINAL'],
  4: ['SEMIFINAL', 'FINAL'],
  2: ['FINAL'],
}

const LLAVES_POR_RONDA = {
  DIECISEISAVOS: 16,
  OCTAVOS: 8,
  CUARTOS: 4,
  SEMIFINAL: 2,
  FINAL: 1,
  TERCER_PUESTO: 1,
}

function buildEmptyRondas(cantidadEquipos, tercerPuesto) {
  const base = RONDAS_POR_CANTIDAD[cantidadEquipos] ?? ['FINAL']
  const ordenRondas = tercerPuesto ? [...base, 'TERCER_PUESTO'] : base

  return ordenRondas.map((ronda) => ({
    ronda,
    llaves: Array.from({ length: LLAVES_POR_RONDA[ronda] ?? 1 }, (_, index) => ({
      numeroLlave: index + 1,
      partido: null,
      ganador: null,
    })),
  }))
}

let nextFaseId = 9

const fasesFinales = [
  {
    id: 8,
    torneo: { id: 1, nombre: 'Copa Caldas 2026', estado: 'EN_CURSO' },
    nombre: 'Fase final',
    tipo: 'FINAL',
    orden: 2,
    cantidadEquipos: 4,
    tercerPuesto: true,
    cantidadPartidos: 2,
  },
]

const llavesPorFase = {
  8: [
    {
      ronda: 'SEMIFINAL',
      llaves: [
        {
          numeroLlave: 1,
          partido: {
            id: 20,
            equipoLocal: { id: 4, nombre: 'Atlético Manizales', activo: true },
            equipoVisitante: { id: 9, nombre: 'Deportivo Caldas', activo: true },
            fechaHora: '2026-12-12T15:30:00',
            estado: 'FINALIZADO',
            marcadorLocal: 2,
            marcadorVisitante: 1,
            tieneResultado: true,
            ronda: 'SEMIFINAL',
            numeroLlave: 1,
          },
          ganador: { id: 4, nombre: 'Atlético Manizales', activo: true },
        },
        {
          numeroLlave: 2,
          partido: {
            id: 21,
            equipoLocal: { id: 5, nombre: 'Titanes FC', activo: true },
            equipoVisitante: { id: 6, nombre: 'Once Caldas', activo: true },
            fechaHora: '2026-12-13T18:00:00',
            estado: 'PROGRAMADO',
            marcadorLocal: null,
            marcadorVisitante: null,
            tieneResultado: false,
            ronda: 'SEMIFINAL',
            numeroLlave: 2,
          },
          ganador: null,
        },
      ],
    },
    {
      ronda: 'FINAL',
      llaves: [{ numeroLlave: 1, partido: null, ganador: null }],
    },
    {
      ronda: 'TERCER_PUESTO',
      llaves: [{ numeroLlave: 1, partido: null, ganador: null }],
    },
  ],
}

export async function obtenerFaseFinal(torneoId) {
  await delay(180)
  const id = Number(torneoId)
  const fase = fasesFinales.find((item) => item.torneo.id === id)
  if (!fase) {
    throw notFound(`El torneo ${id} no tiene una fase final configurada.`)
  }
  return clone(fase)
}

export async function crearFaseFinal(torneoId, payload) {
  await delay(220)
  const id = Number(torneoId)
  if (fasesFinales.some((item) => item.torneo.id === id)) {
    throw conflict('Este torneo ya cuenta con una fase final registrada.')
  }
  if (!CANTIDADES_VALIDAS.includes(Number(payload.cantidadEquipos))) {
    throw httpError(
      400,
      'INVALID_OPERATION',
      'La cantidad de equipos debe ser 2, 4, 8, 16 o 32.',
    )
  }

  const nueva = {
    id: nextFaseId++,
    torneo: { id, nombre: `Torneo #${id}`, estado: 'INSCRIPCIONES_ABIERTAS' },
    nombre: payload.nombre.trim(),
    tipo: 'FINAL',
    orden: Number(payload.orden),
    cantidadEquipos: Number(payload.cantidadEquipos),
    tercerPuesto: Boolean(payload.tercerPuesto),
    cantidadPartidos: 0,
  }

  fasesFinales.push(nueva)
  llavesPorFase[nueva.id] = buildEmptyRondas(nueva.cantidadEquipos, nueva.tercerPuesto)
  return clone(nueva)
}

export async function actualizarFaseFinal(faseFinalId, payload) {
  await delay(220)
  const id = Number(faseFinalId)
  const index = fasesFinales.findIndex((item) => item.id === id)
  if (index === -1) {
    throw notFound(`No existe la fase final con id ${id}.`)
  }

  const actual = fasesFinales[index]
  const nuevaCantidad = Number(payload.cantidadEquipos)
  if (!CANTIDADES_VALIDAS.includes(nuevaCantidad)) {
    throw httpError(
      400,
      'INVALID_OPERATION',
      'La cantidad de equipos debe ser 2, 4, 8, 16 o 32.',
    )
  }
  if (actual.cantidadPartidos > 0 && nuevaCantidad !== actual.cantidadEquipos) {
    throw httpError(
      400,
      'INVALID_OPERATION',
      'No se puede cambiar la cantidad de equipos porque la fase final ya tiene partidos asociados.',
    )
  }

  const actualizada = {
    ...actual,
    nombre: payload.nombre.trim(),
    orden: Number(payload.orden),
    cantidadEquipos: nuevaCantidad,
    tercerPuesto: Boolean(payload.tercerPuesto),
  }

  fasesFinales[index] = actualizada

  if (actual.cantidadPartidos === 0) {
    llavesPorFase[id] = buildEmptyRondas(actualizada.cantidadEquipos, actualizada.tercerPuesto)
  } else {
    const rondasActuales = llavesPorFase[id] ?? []
    const tieneTercerPuesto = rondasActuales.some((r) => r.ronda === 'TERCER_PUESTO')
    if (actualizada.tercerPuesto && !tieneTercerPuesto) {
      llavesPorFase[id] = [
        ...rondasActuales,
        { ronda: 'TERCER_PUESTO', llaves: [{ numeroLlave: 1, partido: null, ganador: null }] },
      ]
    } else if (!actualizada.tercerPuesto && tieneTercerPuesto) {
      llavesPorFase[id] = rondasActuales.filter((r) => r.ronda !== 'TERCER_PUESTO')
    }
  }

  return clone(actualizada)
}

export async function eliminarFaseFinal(faseFinalId) {
  await delay(220)
  const id = Number(faseFinalId)
  const index = fasesFinales.findIndex((item) => item.id === id)
  if (index === -1) {
    throw notFound(`No existe la fase final con id ${id}.`)
  }

  const fase = fasesFinales[index]
  if (fase.cantidadPartidos > 0) {
    throw conflict(
      `No se puede eliminar la fase final porque tiene ${fase.cantidadPartidos} partidos asociados.`,
      'HAS_ASSOCIATIONS',
    )
  }

  fasesFinales.splice(index, 1)
  delete llavesPorFase[id]
}

export async function obtenerLlaves(faseFinalId) {
  await delay(180)
  const id = Number(faseFinalId)
  const fase = fasesFinales.find((item) => item.id === id)
  if (!fase) {
    throw notFound(`No existe la fase final con id ${id}.`)
  }

  return clone({
    fase: {
      id: fase.id,
      nombre: fase.nombre,
      tipo: fase.tipo,
      orden: fase.orden,
    },
    cantidadEquipos: fase.cantidadEquipos,
    tercerPuesto: fase.tercerPuesto,
    rondas: llavesPorFase[id] ?? buildEmptyRondas(fase.cantidadEquipos, fase.tercerPuesto),
  })
}
