/*
 * Validaciones de formularios. Las reglas de la contraseña son las mismas
 * que exige el backend (CreateUserDTO): 8 a 72 caracteres, mayúscula, minúscula,
 * número, carácter especial (@$!%*?&) y sin espacios.
 */
export const PASSWORD_RULES = [
  { id: 'length', label: 'Entre 8 y 72 caracteres', test: (v) => v.length >= 8 && v.length <= 72 },
  { id: 'upper', label: 'Una letra mayúscula', test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'Una letra minúscula', test: (v) => /[a-z]/.test(v) },
  { id: 'number', label: 'Un número', test: (v) => /\d/.test(v) },
  { id: 'special', label: 'Un carácter especial (@$!%*?&)', test: (v) => /[@$!%*?&]/.test(v) },
  { id: 'spaces', label: 'Sin espacios', test: (v) => v.length > 0 && !/\s/.test(v) },
]

export function validatePassword(value) {
  if (!value) return 'La contraseña es obligatoria.'
  const ok = PASSWORD_RULES.every((rule) => rule.test(value))
  return ok ? '' : 'La contraseña no cumple las reglas de seguridad.'
}

export function validatePasswordConfirmation(password, confirmation) {
  if (!confirmation) return 'Confirma la contraseña.'
  return password === confirmation ? '' : 'Las contraseñas no coinciden.'
}

export function validateEmail(value) {
  const email = value.trim()
  if (!email) return 'El correo es obligatorio.'
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'El correo no tiene un formato válido.'
}

// Devuelve el mensaje si el campo está vacío, o '' si tiene valor
export function validateRequired(value, message) {
  return String(value ?? '').trim() ? '' : message
}

export function validateMaxLength(value, max, message) {
  return String(value ?? '').trim().length > max ? message : ''
}

// true si el objeto de errores tiene al menos un mensaje
export function hasErrors(errors) {
  return Object.values(errors).some(Boolean)
}
