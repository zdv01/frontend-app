// "Carlos Admin" → "CA"
export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatDate(value) {
  if (!value) return '—'
  // "1990-05-12" se interpreta como fecha local para que no cambie de día
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', { dateStyle: 'long' })
}

// Compara textos ignorando mayúsculas y tildes ("Gómez" contiene "gomez")
export function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function matchesSearch(search, ...values) {
  const term = normalizeText(search.trim())
  return !term || values.some((value) => normalizeText(value).includes(term))
}

// Filtro de estado de las barras CRUD: 'all' | 'active' | 'inactive'
export function matchesStatus(status, active) {
  if (status === 'active') return active
  if (status === 'inactive') return !active
  return true
}
