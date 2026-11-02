import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { env } from './env'

const firebaseConfig = {
  apiKey: env.firebaseApiKey,
  authDomain: env.firebaseAuthDomain,
  projectId: env.firebaseProjectId,
  appId: env.firebaseAppId,
}

const isConfigured = Object.values(firebaseConfig).every(Boolean)

export const firebaseAuth = isConfigured
  ? getAuth(getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null

export function isFirebaseConfigured() {
  return Boolean(firebaseAuth)
}
