import { useContext } from 'react'
import { ToastContext } from '../context/ToastContext'

// const toast = useToast(); toast.success('Guardado'); toast.error('...'); toast.info('...')
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>')
  }
  return context
}
