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
import { TeamsList } from '../pages/gestion-deportiva/equipos/TeamsList'
import { TeamDetail } from '../pages/gestion-deportiva/equipos/TeamDetail'
import { DesarrolloTorneoPage } from '../pages/gestion-deportiva/desarrollo/DesarrolloTorneoPage'
import { FaseFinalPage } from '../pages/gestion-deportiva/fase-final/FaseFinalPage'
import { PlayersList } from '../pages/gestion-deportiva/jugadores/PlayersList'
import { PlayerDetail } from '../pages/gestion-deportiva/jugadores/PlayerDetail'
import { PartidosList } from '../pages/gestion-deportiva/partidos/PartidosList'
import { PartidoDetail } from '../pages/gestion-deportiva/partidos/PartidoDetail'
import { PerfilJugadorPage } from '../pages/gestion-deportiva/perfil/PerfilJugadorPage'
import { TournamentsList } from '../pages/gestion-deportiva/torneos/TournamentsList'
import { TournamentDetail } from '../pages/gestion-deportiva/torneos/TournamentDetail'
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
          {
            element: <RequirePermission resource="equipos" operation="listar" />,
            children: [
              {
                path: '/equipos',
                element: <TeamsList />,
                handle: { title: 'Equipos', subtitle: 'Administra los equipos y sus asociaciones deportivas.' },
              },
            ],
          },
          {
            element: <RequirePermission resource="equipos" operation="ver" />,
            children: [
              {
                path: '/equipos/:id',
                element: <TeamDetail />,
                handle: { title: 'Detalle del equipo', subtitle: 'Información, deportes y torneos del equipo.' },
              },
            ],
          },
          {
            element: <RequirePermission resource="torneos" operation="listar" />,
            children: [
              {
                path: '/torneos',
                element: <TournamentsList />,
                handle: { title: 'Torneos', subtitle: 'Administra torneos e inscripciones de equipos.' },
              },
            ],
          },
          {
            element: <RequirePermission resource="torneos" operation="ver" />,
            children: [
              {
                path: '/torneos/:id',
                element: <TournamentDetail />,
                handle: { title: 'Detalle del torneo', subtitle: 'Información e inscripciones del torneo.' },
              },
              {
                path: '/torneos/:id/fase-final',
                element: <FaseFinalPage />,
                handle: {
                  title: 'Fase final',
                  subtitle: 'Configuración y cuadro eliminatorio del torneo.',
                },
              },
              {
                path: '/torneos/:id/desarrollo',
                element: <DesarrolloTorneoPage />,
                handle: {
                  title: 'Desarrollo del torneo',
                  subtitle: 'Consulta la estructura, fases, posiciones, partidos y resultados de la competencia.',
                },
              },
            ],
          },
          {
            element: <RequirePermission resource="jugadores" operation="listar" />,
            children: [
              {
                path: '/jugadores',
                element: <PlayersList />,
                handle: { title: 'Jugadores', subtitle: 'Administra los jugadores registrados.' },
              },
            ],
          },
          {
            element: <RequirePermission resource="jugadores" operation="ver" />,
            children: [
              {
                path: '/jugadores/:id',
                element: <PlayerDetail />,
                handle: { title: 'Detalle del jugador', subtitle: 'Datos, habilidades y equipos del jugador.' },
              },
              {
                path: '/jugadores/:id/perfil',
                element: <PerfilJugadorPage />,
                handle: {
                  title: 'Perfil deportivo',
                  subtitle: 'Información general, equipos y habilidades del jugador.',
                },
              },
            ],
          },
          {
            element: <RequirePermission resource="partidos" operation="listar" />,
            children: [
              {
                path: '/partidos',
                element: <PartidosList />,
                handle: { title: 'Partidos', subtitle: 'Programa partidos y registra resultados.' },
              },
            ],
          },
          {
            element: <RequirePermission resource="partidos" operation="ver" />,
            children: [
              {
                path: '/partidos/:id',
                element: <PartidoDetail />,
                handle: { title: 'Detalle del partido', subtitle: 'Estado, resultado y anotaciones del partido.' },
              },
            ],
          },
        ],
      },
    ],
  },

  // Cualquier otra dirección → inicio
  { path: '*', element: <Navigate to="/" replace /> },
])
