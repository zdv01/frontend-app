import { useAuth } from './useAuth'

// Ejemplo: const puedeCrear = useCan('usuarios', 'crear')
export function useCan(resource, operation) {
  return useAuth().can(resource, operation)
}
