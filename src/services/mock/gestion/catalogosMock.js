const sports = [
  { id: 1, nombre: 'Fútbol', descripcion: 'Fútbol 11', activo: true },
  { id: 2, nombre: 'Baloncesto', descripcion: 'Baloncesto', activo: true },
]

const venues = [
  { id: 1, nombre: 'Estadio Palogrande' },
  { id: 2, nombre: 'Coliseo Mayor' },
]

export async function getSports() {
  return sports
}

export async function getVenues() {
  return venues
}
