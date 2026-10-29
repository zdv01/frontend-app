export const env = {
  appName: import.meta.env.VITE_APP_NAME || 'SportManager',
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8181/api',
  // Las variables de Vite siempre llegan como texto, por eso se compara con 'true'
  useMocks: import.meta.env.VITE_USE_MOCKS === 'true',
}
