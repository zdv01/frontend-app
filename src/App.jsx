import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import { ToastProvider } from './context/ToastProvider'
import { router } from './routes/router'

// AuthProvider: quién inició sesión. ToastProvider: avisos flotantes. Router: las pantallas.
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
