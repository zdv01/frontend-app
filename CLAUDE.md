# CLAUDE.md — frontend-app (SportManager · Módulo de Seguridad)

## Contexto del proyecto
- Proyecto del curso **Desarrollo Backend** (Universidad de Caldas), equipo de 3 personas.
- Sistema: plataforma para una empresa organizadora de torneos deportivos ("SportManager").
- **Primera entrega: SOLO el módulo de seguridad** (usuarios, perfiles, roles, permisos, autenticación, 2FA, recuperación de contraseña). No construir pantallas de torneos, equipos, jugadores, deportes, habilidades ni seguimiento todavía.
- Repos del equipo (carpeta padre `..\`):
  - `frontend-app` → este repo (React).
  - `ProyectoDesarrolloBackend` → microservicio de seguridad (lo hacen los compañeros). Antes de conectar un endpoint, leer ese repo para usar las URLs y los JSON reales.
  - `ms-notifications` → servicio en Python/Flask que envía correos (Gmail API). Lo usa el backend para el código 2FA y el enlace de recuperación de contraseña.
- Documentos del profesor en `docs/` (enunciado, entrevista, Anexo 1 con las historias de usuario HU-SE-01 a HU-SE-10, mockup de la matriz de permisos). El Anexo 1 es la fuente de verdad de los criterios de aceptación.

## Stack
- React 19 + Vite, **JavaScript (no TypeScript)**, ESLint ya configurado.
- Comandos: `npm install`, `npm run dev`, `npm run build`, `npm run lint`.
- Dependencias permitidas para agregar: `react-router-dom` (rutas), `axios` (HTTP), `lucide-react` (iconos). No agregar otras librerías de UI ni Tailwind sin preguntar primero.
- Variables de entorno: copiar `.env.example` a `.env`. Las variables de Vite deben empezar por `VITE_` (ej. `VITE_API_URL`). Nunca subir `.env` a Git.

## Reglas de trabajo
- Todo el texto visible de la interfaz va en **español**.
- Componentes funcionales con hooks. Archivos de componentes en PascalCase (`UsersPage.jsx`).
- Explicar los cambios de forma sencilla: el usuario está aprendiendo React y el flujo de trabajo.
- Hacer cambios pequeños y verificables; correr `npm run lint` antes de dar algo por terminado.
- Git: trabajar en la rama `feature/frontend-seguridad`, nunca directo en `main`. Commits cortos y descriptivos en español. No hacer push sin que el usuario lo pida.

## Estructura sugerida de `src/`
```
src/
├── api/            # cliente axios (baseURL desde VITE_API_URL, interceptor que agrega el token)
├── services/       # authService, usersService, rolesService, permissionsService, profileService
│   └── mock/       # datos de prueba mientras el backend no esté listo
├── context/        # AuthContext: usuario actual, token, permisos efectivos, login/logout
├── components/     # Sidebar, Topbar, DataTable, Modal, Toast, ConfirmDialog, Badge, PermissionGate
├── layouts/        # AuthLayout (pantallas públicas) y AdminLayout (sidebar + topbar)
├── pages/
│   ├── auth/       # Login, Register, TwoFactor, ForgotPassword, ResetPassword
│   └── security/   # Users, Roles, RoleUsers, Permissions, RolePermissions, Profile
├── routes/         # definición de rutas + ProtectedRoute
└── styles/         # tokens.css (variables de color) y estilos globales
```
- **Capa de servicios obligatoria:** las páginas nunca llaman a axios directamente; llaman a `services/`. Mientras el backend no exista, los servicios devuelven datos de `services/mock/` (controlado por una variable como `VITE_USE_MOCKS=true`). Cuando el backend esté listo, solo se cambian los servicios, no las pantallas.

## Estilo visual (seguir los mockups)
Tema oscuro tipo panel deportivo, con verde neón como color de acción.
```css
--bg:            #060d1a;   /* fondo de la app */
--panel:         #0b1628;   /* tarjetas y paneles */
--panel-2:       #0f1e35;   /* filas, inputs */
--border:        #1c3354;   /* bordes finos de paneles y tablas */
--text:          #e6eef8;
--text-muted:    #8ea3bd;
--primary:       #2ee55a;   /* verde neón: botones principales, checks, item activo del menú */
--primary-glow:  rgba(46, 229, 90, 0.35);
--accent:        #22d3ee;   /* cian: títulos de página y de sección */
--danger:        #ef4444;
--warning:       #f59e0b;
--info:          #3b82f6;
```
- **Sidebar** a la izquierda: logo "SPORTMANAGER · Plataforma administrativa", items Dashboard, Usuarios, Roles, Permisos, Seguridad, Auditoría; el item activo con fondo verde translúcido y borde verde. Abajo, caja de "Sesión activa".
- **Topbar**: título grande en cian + subtítulo gris; a la derecha, campana de notificaciones y avatar con nombre, rol y menú (Mi perfil, Cerrar sesión).
- **Patrón CRUD** (igual en Usuarios, Roles, Permisos): barra con buscador + filtro de estado + botón verde "+ Nuevo …"; tabla con encabezados ordenables; columna Estado con badge (Activo verde / Inactivo gris); acciones con iconos ver (azul), editar (azul), eliminar/desactivar (rojo); paginación "Mostrando 1 a N de M"; panel de detalle a la derecha al seleccionar una fila; modal "Registrar / Editar …" con campos obligatorios marcados con `*`, error en rojo bajo el campo, botones Cancelar y Guardar (verde).
- **Toasts**: verde para éxito ("Permisos actualizados correctamente."), rojo para errores de regla de negocio ("No se puede eliminar el rol porque tiene usuarios asignados."), azul para información.
- Bordes redondeados (~10–12px), sombras suaves con brillo verde en el botón principal, tipografía sans-serif (Inter).

## Pantallas de la primera entrega
### Públicas (AuthLayout, sin sidebar)
1. **Login** (HU-SE-08): correo + contraseña; botones Google, GitHub y Microsoft; links a Registro y Recuperar contraseña; error si las credenciales son incorrectas o el usuario está deshabilitado. Si el backend responde que requiere 2FA → ir a la pantalla 2FA sin dar la sesión por iniciada.
2. **Registro** (HU-SE-07): nombre, correo, contraseña, confirmar contraseña; validar obligatorios y reglas de contraseña (mín. 8 caracteres, mayúscula, minúscula, número); mostrar "El correo ya está registrado".
3. **Verificación 2FA** (HU-SE-10): campo de código; Verificar; Cancelar (vuelve al login sin sesión); error si el código es incorrecto o expiró.
4. **Recuperar contraseña** (HU-SE-09): pedir correo; mensaje de "si el correo existe, recibirás un enlace".
5. **Nueva contraseña** (HU-SE-09): se abre con el token del enlace; nueva contraseña + confirmación; error si el enlace expiró o ya se usó.

### Administración (AdminLayout, rutas protegidas)
6. **Usuarios** (HU-SE-01): CRUD; correo único; desactivar en lugar de borrar cuando aplique; desde cada usuario acceder a su perfil y sus roles.
7. **Roles** (HU-SE-03): CRUD con nombre + descripción; nombre único; al eliminar, avisar si tiene usuarios asignados; desde el detalle ir a "Usuarios del rol" y "Permisos del rol".
8. **Usuarios del rol** (HU-SE-04): lista de usuarios con el rol; agregar desde la lista de usuarios disponibles (los que aún no lo tienen); retirar con diálogo de confirmación; no permitir duplicados.
9. **Permisos** (HU-SE-05): CRUD con recurso/módulo, operación (Ver, Listar, Crear, Actualizar, Eliminar), URL y método HTTP; no permitir duplicados de operación + recurso.
10. **Asignar permisos a roles** (HU-SE-06) — **tiene mockup, replicarlo**: selector de rol; botones Cargar permisos, Guardar cambios (verde), Restablecer; matriz con filas = recursos agrupados por módulo (Administración: Usuarios, Roles, Permisos; Gestión Deportiva; Comercial; Infraestructura; Reportes) con grupos colapsables y columnas Ver/Listar/Crear/Actualizar/Eliminar como checkboxes; solo se guarda al presionar Guardar; Restablecer vuelve al último estado guardado. Panel derecho: Resumen del rol (nombre, estado, usuarios asociados, total de permisos asignados, módulos con acceso, tarjetas Disponibles/Asignados/No asignados), Leyenda, Reglas de acceso y aviso rojo "Retirar un permiso del rol no elimina el permiso del sistema".
11. **Mi perfil** (HU-SE-02 + HU-SE-10): ver/editar teléfono y fotografía (no cambia correo ni contraseña); interruptor para activar/desactivar 2FA, visible solo si el usuario entró con correo y contraseña (no OAuth).

## Lógica transversal
- Al iniciar sesión, guardar el token y su fecha de expiración; enviarlo como `Authorization: Bearer <token>` en cada petición (interceptor de axios).
- Si el backend responde 401 o el token expiró → limpiar sesión y redirigir a `/login`.
- **Cerrar sesión**: llamar al endpoint de logout y limpiar el token local.
- `ProtectedRoute`: sin sesión → `/login`.
- **Permisos efectivos**: el usuario tiene un permiso si **al menos uno de sus roles** lo tiene. Usar un componente `PermissionGate` / hook `useCan(recurso, operacion)` para ocultar botones y entradas del menú que no puede usar.
- OAuth: los botones redirigen a la URL de OAuth del backend; crear una ruta `/auth/callback` que reciba el token y complete el login.

## Prioridad
1. Base: router, layouts, tokens de estilo, componentes comunes, AuthContext con mocks.
2. Login, Registro, Usuarios, Roles, Matriz de permisos.
3. Permisos, Usuarios del rol, Mi perfil.
4. 2FA, recuperación de contraseña y OAuth (dependen del backend y de ms-notifications).
