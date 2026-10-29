import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { AuthLayout } from '../layouts/AuthLayout'
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage'
import { LoginPage } from '../pages/auth/LoginPage'
import { OAuthCallbackPage } from '../pages/auth/OAuthCallbackPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage'
import { TwoFactorPage } from '../pages/auth/TwoFactorPage'
import { PlaceholderPage } from '../pages/PlaceholderPage'
import { DashboardPage } from '../pages/security/DashboardPage'
import { PermissionsPage } from '../pages/security/PermissionsPage'
import { ProfilePage } from '../pages/security/ProfilePage'
import { RolePermissionsPage } from '../pages/security/RolePermissionsPage'
import { RolesPage } from '../pages/security/RolesPage'
import { RoleUsersPage } from '../pages/security/RoleUsersPage'
import { SecurityPage } from '../pages/security/SecurityPage'
import { UsersPage } from '../pages/security/UsersPage'
import { GuestRoute } from './GuestRoute'
import { ProtectedRoute } from './ProtectedRoute'
import { RequirePermission } from './RequirePermission'

/*
 * Mapa de rutas de la app.
 * - "handle" guarda el título y subtítulo que muestra la Topbar.
 * - RequirePermission bloquea la pantalla si ningún rol del usuario tiene ese permiso.
 */
export const router = createBrowserRouter([
  // Pantallas públicas: solo accesibles SIN sesión
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage />, handle: { title: 'Iniciar sesión' } },
          { path: '/register', element: <RegisterPage />, handle: { title: 'Crear cuenta' } },
          {
            path: '/verify-2fa',
            element: <TwoFactorPage />,
            handle: { title: 'Verificación en dos pasos' },
          },
          {
            path: '/forgot-password',
            element: <ForgotPasswordPage />,
            handle: { title: 'Recuperar contraseña' },
          },
          {
            path: '/reset-password',
            element: <ResetPasswordPage />,
            handle: { title: 'Nueva contraseña' },
          },
        ],
      },
    ],
  },

  // Regreso desde Google/GitHub/Microsoft (OAuth): recibe el token del backend
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/auth/callback',
        element: <OAuthCallbackPage />,
        handle: { title: 'Completando inicio de sesión' },
      },
    ],
  },

  // Pantallas privadas: requieren sesión y usan el AdminLayout
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          {
            path: '/dashboard',
            element: <DashboardPage />,
            handle: { title: 'Dashboard', subtitle: 'Resumen general del módulo de seguridad.' },
          },
          {
            element: <RequirePermission resource="usuarios" operation="listar" />,
            children: [
              {
                path: '/users',
                element: <UsersPage />,
                handle: {
                  title: 'Usuarios',
                  subtitle: 'Administra las personas que pueden acceder al sistema.',
                },
              },
            ],
          },
          {
            element: <RequirePermission resource="usuarios" operation="ver" />,
            children: [
              {
                path: '/users/:userId/profile',
                element: <ProfilePage />,
                handle: {
                  title: 'Perfil del usuario',
                  subtitle: 'Consulta y actualiza la información personal del usuario.',
                },
              },
            ],
          },
          {
            element: <RequirePermission resource="roles" operation="listar" />,
            children: [
              {
                path: '/roles',
                element: <RolesPage />,
                handle: {
                  title: 'Roles',
                  subtitle: 'Define los niveles de acceso que se asignan a los usuarios.',
                },
              },
            ],
          },
          {
            element: <RequirePermission resource="roles" operation="ver" />,
            children: [
              {
                path: '/roles/:roleId/users',
                element: <RoleUsersPage />,
                handle: {
                  title: 'Usuarios del rol',
                  subtitle: 'Agrega o retira usuarios de este rol.',
                },
              },
              {
                path: '/role-permissions',
                element: <RolePermissionsPage />,
                handle: {
                  title: 'Asignar Permisos a Roles',
                  subtitle:
                    'Administra de manera centralizada los permisos que puede ejecutar cada rol del sistema.',
                },
              },
            ],
          },
          {
            element: <RequirePermission resource="permisos" operation="listar" />,
            children: [
              {
                path: '/permissions',
                element: <PermissionsPage />,
                handle: {
                  title: 'Permisos',
                  subtitle: 'Gestiona las operaciones que pueden autorizarse a los roles.',
                },
              },
            ],
          },
          {
            path: '/security',
            element: <SecurityPage />,
            handle: {
              title: 'Seguridad',
              subtitle: 'Tu sesión, tus roles y los permisos que tienes en la plataforma.',
            },
          },
          {
            path: '/audit',
            element: <PlaceholderPage />,
            handle: { title: 'Auditoría', subtitle: 'Registro de actividad del sistema.' },
          },
          {
            path: '/profile',
            element: <ProfilePage />,
            handle: {
              title: 'Mi perfil',
              subtitle: 'Consulta y actualiza tu información personal.',
            },
          },
        ],
      },
    ],
  },

  // Cualquier otra dirección → inicio
  { path: '*', element: <Navigate to="/" replace /> },
])
