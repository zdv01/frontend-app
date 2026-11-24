import { formatDateTime } from '../../../utils/format'

// Estados del partido (ACUERDOS 6.12) con su etiqueta y color de badge
export const ESTADOS = {
  PROGRAMADO: { label: 'Programado', badge: 'badge-info' },
  EN_JUEGO: { label: 'En juego', badge: 'badge-warning' },
  FINALIZADO: { label: 'Finalizado', badge: 'badge-success' },
  CANCELADO: { label: 'Cancelado', badge: 'badge-danger' },
}

export const ESTADOS_PARTIDO = Object.keys(ESTADOS)
export const estadoLabel = (estado) => ESTADOS[estado]?.label ?? estado

// Transiciones válidas: PROGRAMADO -> EN_JUEGO/CANCELADO, EN_JUEGO -> FINALIZADO/CANCELADO
export const TRANSICIONES = {
  PROGRAMADO: ['EN_JUEGO', 'CANCELADO'],
  EN_JUEGO: ['FINALIZADO', 'CANCELADO'],
  FINALIZADO: [],
  CANCELADO: [],
}

// Acción que se muestra al usuario para cada estado destino
export const ACCION_ESTADO = {
  EN_JUEGO: { label: 'Iniciar partido', variant: 'btn-outline-primary' },
  FINALIZADO: { label: 'Finalizar partido', variant: 'btn-outline-primary' },
  CANCELADO: { label: 'Cancelar partido', variant: 'btn-outline-danger' },
}

export const RONDAS = {
  DIECISEISAVOS: 'Dieciseisavos',
  OCTAVOS: 'Octavos',
  CUARTOS: 'Cuartos',
  SEMIFINAL: 'Semifinal',
  TERCER_PUESTO: 'Tercer puesto',
  FINAL: 'Final',
}

// Marcador "2 - 1" o guion si todavía no hay resultado
export const marcadorTexto = (partido) => (partido.tieneResultado ? `${partido.marcadorLocal} - ${partido.marcadorVisitante}` : '—')

export const fechaHoraTexto = (valor) => (valor ? formatDateTime(valor) : '—')

// Texto de la ronda y la llave ("Semifinal · llave 2")
export function rondaTexto(partido) {
  if (!partido.ronda) return '—'
  return `${RONDAS[partido.ronda] ?? partido.ronda}${partido.numeroLlave ? ` · llave ${partido.numeroLlave}` : ''}`
}
