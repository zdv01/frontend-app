const configuredApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8181'
const apiUrl = configuredApiUrl.replace(/\/+$/, '').endsWith('/api')
  ? configuredApiUrl.replace(/\/+$/, '')
  : `${configuredApiUrl.replace(/\/+$/, '')}/api`

export const env = {
  appName: import.meta.env.VITE_APP_NAME || 'SportManager',
  apiUrl,
  // Las variables de Vite siempre llegan como texto, por eso se compara con 'true'
  useMocks: import.meta.env.VITE_USE_MOCKS === 'true',
  firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  firebaseAuthDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  firebaseAppId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}
