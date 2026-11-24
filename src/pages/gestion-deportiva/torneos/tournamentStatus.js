export const tournamentStatusLabels = {
  INSCRIPCIONES_ABIERTAS: 'Inscripciones abiertas',
  INSCRIPCIONES_CERRADAS: 'Inscripciones cerradas',
  EN_CURSO: 'En curso',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
}

export const tournamentStatusTransitions = {
  INSCRIPCIONES_ABIERTAS: ['INSCRIPCIONES_CERRADAS', 'CANCELADO'],
  INSCRIPCIONES_CERRADAS: ['INSCRIPCIONES_ABIERTAS', 'EN_CURSO', 'CANCELADO'],
  EN_CURSO: ['FINALIZADO', 'CANCELADO'],
  FINALIZADO: [],
  CANCELADO: [],
}

export function getTournamentStatusLabel(tournament) {
  if (
    tournament?.estado === 'INSCRIPCIONES_ABIERTAS'
    && tournament.inscripcionesAbiertas === false
  ) {
    return 'Inscripciones cerradas (vencidas)'
  }
  return tournamentStatusLabels[tournament?.estado] ?? tournament?.estado ?? '—'
}
