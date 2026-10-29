// Formas de iniciar sesión (HU-SE-08)
export const AUTH_PROVIDERS = {
  local: 'Correo y contraseña',
  google: 'Google',
  github: 'GitHub',
  microsoft: 'Microsoft',
}

export const OAUTH_PROVIDERS = ['google', 'github', 'microsoft']

export function getProviderLabel(provider) {
  return AUTH_PROVIDERS[provider] ?? provider
}
