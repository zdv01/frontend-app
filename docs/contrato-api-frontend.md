# Contrato API: lo que el frontend espera del microservicio de seguridad

Este documento lista **todas las llamadas que hace el frontend** (`frontend-app`) al microservicio de seguridad (`ProyectoDesarrolloBackend`). Para cada una indica si ya existe o si falta, y qué JSON se espera.

El front ya funciona con datos simulados (`VITE_USE_MOCKS=true`). Para conectarlo al backend real basta con poner `VITE_USE_MOCKS=false` en el `.env`; no hay que cambiar pantallas. El código de cada llamada está en `src/services/*.js`.

- Base URL usada por el front: `http://localhost:8181/api` (variable `VITE_API_URL`).
- Origen del front en desarrollo: `http://localhost:5173`.

Leyenda: ✅ ya existe en el backend · 🆕 hay que crearlo · ✏️ existe, pero hay que cambiarlo.

---

## 1. Reglas generales

- **Token:** el front envía `Authorization: Bearer <accessToken>` en todas las peticiones, menos en las públicas de `/auth/*`.
- **401 = sesión inválida o expirada.** El front borra la sesión y manda al usuario al login. En `/auth/*` un 401 se interpreta como "credenciales o código incorrectos" y se muestra el `message`.
- **Errores:** el front ya entiende los dos formatos que devuelve `GlobalExceptionHandler`:
  - Negocio: `{ "errorCase": "ALREADY_EXISTS" | "NOT_FOUND" | "INVALID_OPERATION" | "UNAUTHORIZED", "message": "..." }`. El `message` se muestra tal cual, así que debe venir **en español y listo para el usuario**.
  - Validación (400): `{ "campo": "mensaje" }`. Cada mensaje se coloca debajo del campo del formulario que se llame igual (`name`, `email`, `password`, `phone`, `birthDate`…).
- **Duplicados:** 409 con `errorCase: "ALREADY_EXISTS"`. El front pone el mensaje bajo el campo que corresponda (correo, nombre del rol u operación del permiso).

---

## 2. CORS (🆕, bloqueante)

Hoy no hay configuración de CORS, así que el navegador rechaza todas las peticiones del front. Además, la petición `OPTIONS` previa (preflight) pasa por `DynamicAuthorizationManager` y queda denegada. Propuesta para `SecurityConfig`:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://localhost:5173"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}

// en securityFilterChain:
http.cors(Customizer.withDefaults())
    .authorizeHttpRequests(auth -> auth
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
        .requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/2fa/verify",
                         "/api/auth/2fa/resend", "/api/auth/forgot-password",
                         "/api/auth/reset-password", "/api/auth/oauth/**").permitAll()
        .anyRequest().access(dynamicAuthorizationManager))
```

---

## 3. Autenticación (`src/services/authService.js`)

| | Método y URL | Petición | Respuesta esperada |
|---|---|---|---|
| ✏️ | `POST /auth/login` | `{ email, password }` | Sin 2FA: `{ accessToken, tokenType, expiresAt }` (como hoy). **Con 2FA activo:** `{ requires2FA: true, challengeId }` y **sin** token. Usuario deshabilitado: 403 con `message`. Credenciales malas: 401 `"Credenciales incorrectas"`. |
| 🆕 | `GET /auth/me` | — (con Bearer) | `{ id, name, email, authProvider, twoFactorEnabled, photo, roles: [{id, name, description}], permissions: [{ id, url, method, model, resource?, operation? }] }`. `permissions` = **permisos efectivos** (unión de los permisos de todos sus roles). |
| 🆕 | `POST /auth/2fa/verify` | `{ challengeId, code }` | `{ accessToken, tokenType, expiresAt }`. Código incorrecto o vencido: 401 con `message`. |
| 🆕 | `POST /auth/2fa/resend` | `{ challengeId }` | 204. Genera un código nuevo y lo envía por `ms-notifications`. |
| 🆕 | `PUT /auth/2fa` | `{ enabled: true \| false }` (con Bearer) | `{ twoFactorEnabled }`. Solo para usuarios `authProvider = "local"`; si no, 409. |
| 🆕 | `POST /auth/register` | `{ name, email, password }` | 201 `{ id, name, email }`. Correo repetido: 409 `"El correo ya está registrado."` **Debe ser público** (hoy `POST /users` exige token). |
| 🆕 | `POST /auth/forgot-password` | `{ email }` | **Siempre 204**, exista o no el correo. Solo envía el enlace a cuentas locales activas. |
| 🆕 | `POST /auth/reset-password` | `{ token, password }` | 204. Token vencido o ya usado: 400 con `message`. Debe invalidar las sesiones anteriores. |
| 🆕 | `POST /auth/logout` | — (con Bearer) | 204. El token deja de ser válido. |
| 🆕 | `GET /auth/oauth/{provider}` | `provider` = `google`, `github` o `microsoft` | Redirige al proveedor. Al volver, el backend redirige a `http://localhost:5173/auth/callback?token=...&expiresAt=...`, o en caso de error a `?error=Mensaje en español`. |

**Reglas de OAuth (HU-SE-08)**
- **Primera vez:** se crea el usuario con los datos del proveedor.
- **Siguientes accesos:** se identifica al mismo usuario, sin crear otro.
- **Correo que ya existe con correo y contraseña:** se rechaza con `?error=...`.

**Enlace de recuperación:** el correo debe apuntar a `http://localhost:5173/reset-password?token=<token>`.

> Mientras no exista `/auth/me`, el front arma la sesión con `GET /users/{id}` (id = `sub` del JWT), `GET /user-roles/users/{id}` y `GET /role-permissions/roles/{roleId}`. Por eso esos endpoints también deben estar permitidos para el usuario autenticado (ver sección 6).

---

## 4. Endpoints existentes que usa el front

| | Método y URL | Uso en el front | Notas |
|---|---|---|---|
| ✅ | `GET /users` | Lista de Usuarios | Agregar `active`, `authProvider` y `twoFactorEnabled` a `UserResponseDTO` (sección 5). |
| ✅ | `GET /users/{id}` | Perfil de otro usuario | — |
| ✅ | `POST /users` | "Nuevo usuario" (admin) | — |
| ✅ | `PUT /users/{id}` | Editar usuario | El front **no envía `password`** si no se cambia; hoy es opcional en `UpdateUserDTO`, así que funciona. |
| 🆕 | `PATCH /users/{id}/status` | Activar/desactivar | `{ active }` → `UserResponseDTO`. HU-SE-01 pide desactivar en lugar de borrar. El front ya no usa `DELETE /users/{id}`. |
| ✅ | `GET /users/{id}/profile` | Mi perfil / perfil de usuario | 404 si no tiene perfil: el front lo trata como "sin perfil" y luego hace POST. |
| ✏️ | `POST` / `PUT /users/{id}/profile` | Guardar perfil | Envía `{ phone, birthDate, photo }`. Falta el campo **`photo`**: el front manda un *data URL* (`data:image/png;base64,...`) de hasta 1 MB, así que la columna debe ser `TEXT`/`LONGTEXT`. |
| ✅ | `GET /roles` · `GET /roles/{id}` | Roles, matriz, usuarios del rol | — |
| ✏️ | `POST /roles` · `PUT /roles/{id}` | Formulario de rol | Envía `{ name, description, active }`. Falta `active` en `Role`. |
| ✅ | `DELETE /roles/{id}` | Eliminar rol | Si tiene usuarios: 409 `"No se puede eliminar el rol porque tiene usuarios asignados."` (el front también lo verifica antes). |
| ✅ | `GET /permissions` | Permisos y matriz | — |
| ✏️ | `POST /permissions` · `PUT /permissions/{id}` | Formulario de permiso | Envía `{ url, method, model, resource, operation, active }` (ver nota abajo). |
| ✅ | `DELETE /permissions/{id}` | Eliminar permiso | Debe retirar el permiso de los roles **sin borrar los roles**. |
| ✅ | `GET /user-roles/users/{userId}` | Roles de un usuario | Respuesta `[{ id, userId, role }]`. |
| ✅ | `GET /user-roles/roles/{roleId}` | Usuarios del rol | Respuesta `[{ id, roleId, user }]`. |
| ✅ | `POST /user-roles` | Asignar rol | `{ userId, roleId }`. Duplicado: 409. |
| ✅ | `DELETE /user-roles/{userId}/{roleId}` | Retirar rol | — |
| ✅ | `GET /role-permissions/roles/{roleId}` | Matriz: permisos del rol | Respuesta `[{ id, roleId, permission }]`. |
| ✅ | `GET /role-permissions/permissions/{permissionId}` | "Roles con este permiso" | — |
| ✅ | `POST /role-permissions` | Matriz: marcar | `{ roleId, permissionId }`. |
| ✅ | `DELETE /role-permissions/{roleId}/{permissionId}` | Matriz: desmarcar | — |

**"Guardar cambios" de la matriz.** El front calcula qué permisos se marcaron y cuáles se desmarcaron, y hace un `POST` o un `DELETE` por cada uno. Un endpoint en bloque sería más eficiente, pero **no es obligatorio**:

```
PUT /role-permissions/roles/{roleId}   { "permissionIds": [1, 2, 3] }
```

**Operación de un permiso.** La matriz necesita saber la operación de cada permiso: Ver, Listar, Crear, Actualizar o Eliminar.
- **Hoy:** si el backend no la envía, el front la **deduce**:
  - `GET` con `{id}` en la URL → `ver`
  - `GET` sin `{id}` → `listar`
  - `POST` → `crear`
  - `PUT` o `PATCH` → `actualizar`
  - `DELETE` → `eliminar`
- **Lo ideal:** guardar y devolver `operation` (y opcionalmente `resource`) en `Permission`, con unicidad por **operación + recurso** (HU-SE-05). Hoy la unicidad es por `url + method + model`.
- **Recurso:** el front traduce `model` así: `User`→usuarios, `Role`→roles, `Permission`→permisos, `Tournament`→torneos, `Team`→equipos, `Player`→jugadores, `Match`→partidos, `Ticket`→entradas, `Venue`→escenarios y `Report`→reportes.

---

## 5. Campos nuevos que el front ya envía o lee

| Entidad | Campo | Tipo | Para qué |
|---|---|---|---|
| `User` | `active` | boolean (por defecto `true`) | Desactivar usuarios; un usuario inactivo no puede iniciar sesión |
| `User` | `authProvider` | `"local" \| "google" \| "github" \| "microsoft"` | Mostrar el método de acceso; 2FA y recuperación solo aplican a `local` |
| `User` | `twoFactorEnabled` | boolean | HU-SE-10 |
| `Role` | `active` | boolean | Un rol inactivo no aporta permisos |
| `Permission` | `active` | boolean | Un permiso inactivo no se puede asignar |
| `Permission` | `operation` (y opcional `resource`) | string | Ver la sección 4 |
| `Profile` | `photo` | texto largo (data URL) | HU-SE-02 |

Si un campo no llega, el front usa estos valores por defecto: `active: true`, `authProvider: "local"`, `twoFactorEnabled: false`.

---

## 6. Permisos que faltan crear al arrancar el backend (`DatabaseSeeder`)

`DynamicAuthorizationManager` exige un permiso para **cada** URL. Hoy el seeder solo crea el CRUD de `users`, `roles` y `permissions`, así que el administrador recibiría **403** en:

- `GET/POST /api/user-roles`, `GET /api/user-roles/users/{id}`, `GET /api/user-roles/roles/{id}`, `DELETE /api/user-roles/{id}/{id}`
- `GET/POST /api/role-permissions`, `GET /api/role-permissions/roles/{id}`, `GET /api/role-permissions/permissions/{id}`, `DELETE /api/role-permissions/{id}/{id}`
- `GET /api/users/{id}/detail*`, `GET /api/roles/{id}/detail-with-permissions`
- `GET/POST/PUT /api/users/{id}/profile`
- `PATCH /api/users/{id}/status` (cuando exista)

Ojo: `normalizeUrl` cambia **todos** los números por `{id}`, así que `/api/user-roles/5/2` queda como `/api/user-roles/{id}/{id}`. Los permisos sembrados deben usar esa forma.

Además, **todo usuario autenticado** (sin importar su rol) debe poder usar estas rutas:
- `/auth/me`, `/auth/logout` y `/auth/2fa`;
- el **perfil propio**, es decir, cuando el `{userId}` de la URL coincide con el `sub` del token.

---

## 7. Otras diferencias detectadas

- **Contraseña:** el backend exige además un **carácter especial** (`@$!%*?&`) y no permite espacios. El front ya valida exactamente la misma regla, así que conviene no cambiarla sin avisar.
- **Perfil:** `birthDate` es obligatorio en `ProfileRequestDTO`, así que el formulario de perfil lo pide. Si el equipo decide que no sea obligatorio, avisar para quitar el `*`.
- **Login:** `AuthService.login` no revisa si el usuario está habilitado (falta el campo `active`).
- **Sesiones:** `JwtService` no guarda la sesión en la tabla `sessions`. Para que el logout invalide el token (HU-SE-08), hay que guardarla y revisarla en cada petición, o mantener una lista de tokens revocados.
- **Seguridad del repo:** `application.properties` tiene la contraseña real de MySQL subida a Git. Se recomienda usar una variable de entorno, como ya se hace con `JWT_SECRET`.
