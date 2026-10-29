// Herramientas para que el mock se comporte como un backend real

// Simula la demora de la red
export function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Crea un error con la misma forma que un error de axios + backend:
// error.response = { status, data: { errorCase, message } }
export function httpError(status, errorCase, message) {
  const error = new Error(message)
  error.response = { status, data: { errorCase, message } }
  return error
}

export function notFound(message) {
  return httpError(404, 'NOT_FOUND', message)
}

export function conflict(message, errorCase = 'ALREADY_EXISTS') {
  return httpError(409, errorCase, message)
}

// Copia profunda: así las pantallas nunca modifican la "base de datos" por accidente
export function clone(value) {
  return structuredClone(value)
}
