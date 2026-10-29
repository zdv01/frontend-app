import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { ToastContext } from './ToastContext'

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info }
const DURATION_MS = 5000

/*
 * Avisos flotantes arriba a la derecha:
 * verde = éxito, rojo = error de regla de negocio, azul = información.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id))
  }, [])

  const show = useCallback(
    (type, message) => {
      const id = crypto.randomUUID()
      setToasts((list) => [...list, { id, type, message }])
      setTimeout(() => dismiss(id), DURATION_MS)
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      success: (message) => show('success', message),
      error: (message) => show('error', message),
      info: (message) => show('info', message),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type]
          return (
            <div key={toast.id} className={`toast toast-${toast.type}`} role="status">
              <Icon size={20} className="toast-icon" aria-hidden="true" />
              <p>{toast.message}</p>
              <button
                type="button"
                className="btn btn-icon"
                onClick={() => dismiss(toast.id)}
                aria-label="Cerrar aviso"
              >
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
