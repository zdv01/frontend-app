/*
 * Convierte un error de axios en un mensaje en español para mostrar al usuario.
 * El backend responde de dos formas:
 *   - Errores de negocio:  { "errorCase": "ALREADY_EXISTS", "message": "..." }
 *   - Errores de validación (400): { "email": "El email es obligatorio", ... }
 */
export function getApiErrorMessage(error, fallback = 'Ocurrió un error inesperado.') {
  if (!error?.response) {
    return 'No se pudo conectar con el servidor.'
  }

  const { status, data } = error.response
  if (data?.message) {
    return data.message
  }
  if (data && typeof data === 'object') {
    const firstFieldError = Object.values(data)[0]
    if (typeof firstFieldError === 'string') {
      return firstFieldError
    }
  }
  if (status === 403) {
    return 'No tienes permiso para realizar esta operación.'
  }
  return fallback
}

// "ALREADY_EXISTS", "NOT_FOUND", "INVALID_OPERATION", "UNAUTHORIZED" o null
export function getApiErrorCase(error) {
  return error?.response?.data?.errorCase ?? null
}

// Errores por campo de una respuesta 400: { email: '...', password: '...' }
export function getApiFieldErrors(error) {
  const data = error?.response?.data
  if (error?.response?.status !== 400 || !data || data.message) {
    return {}
  }
  return data
}
