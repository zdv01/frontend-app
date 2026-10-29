import { createContext } from 'react'

// "Caja" compartida donde vive la sesión. El AuthProvider la llena
// y cualquier componente la lee con el hook useAuth().
export const AuthContext = createContext(null)
