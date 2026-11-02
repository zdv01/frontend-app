# Contrato API: lo que el frontend espera del microservicio de seguridad

Este documento lista **todas las llamadas que hace el frontend** (`frontend-app`) al microservicio de seguridad (`ProyectoDesarrolloBackend`). Para cada una indica si ya existe o si falta, y qué JSON se espera.

El front ya funciona con datos simulados (`VITE_USE_MOCKS=true`). Para conectarlo al backend real basta con poner `VITE_USE_MOCKS=false` en el `.env`; no hay que cambiar pantallas. El código de cada llamada está en `src/services/*.js`.

- Base URL usada por el front: `http://localhost:8181/api` (variable `VITE_API_URL`).
- Origen del front en desarrollo: `http://localhost:5173`.

El contrato fue verificado contra `ProyectoDesarrolloBackend`. El frontend
normaliza las diferencias de nombres de los DTO en `src/services/mappers.js`.

---

## 1. Reglas generales

- **Token:** el front envía `Authorization: Bearer <accessToken>` en todas las peticiones, menos en las públicas de `/auth/*`.
- **401 = sesión inválida o expirada.** El front borra la sesión y manda al usuario al login. En `/auth/*` un 401 se interpreta como "credenciales o código incorrectos" y se muestra el `message`.
- **Errores:** el front ya entiende los dos formatos que devuelve `GlobalExceptionHandler`:
  - Negocio: `{ "errorCase": "ALREADY_EXISTS" | "NOT_FOUND" | "INVALID_OPERATION" | "UNAUTHORIZED", "message": "..." }`. El `message` se muestra tal cual, así que debe venir **en español y listo para el usuario**.
  - Validación (400): `{ "campo": "mensaje" }`. Cada mensaje se coloca debajo del campo del formulario que se llame igual (`name`, `email`, `password`, `phone`, `birthDate`…).
- **Duplicados:** 409 con `errorCase: "ALREADY_EXISTS"`. El front pone el mensaje bajo el campo que corresponda (correo, nombre del rol u operación del permiso).

---

## 2. CORS (✅ implementado)

El backend ya configura CORS mediante `security.cors.allowed-origins`,
permite `http://localhost:5173` por defecto y atiende el preflight antes de la
autorización dinámica. Ver `SecurityConfig`.

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
| ✅ | `POST /auth/login` | `{ email, password }` | `{ accessToken, tokenType, expiresAt, twoFactorRequired, challengeId }`; con 2FA no entrega token. |
| ✅ | `GET /auth/me` | — (con Bearer) | Devuelve `photoUrl`, `roles: string[]`, permisos efectivos, `twoFactorEnabled` y `authMethod`. |
| ✅ | `POST /auth/2fa/verify` | `{ challengeId, code }` | Devuelve una sesión activa. |
| 🆕 | `POST /auth/2fa/resend` | `{ challengeId }` | Aún no existe; el frontend no lo ofrece en modo real. |
| ✅ | `PUT /auth/2fa-settings` | `{ enabled: true \| false }` (con Bearer) | Responde `204`. Solo aplica a cuentas locales. |
| ✅ | `POST /users` | `{ name, email, password }` | Registro público y creación administrativa según exista sesión. |
| ✅ | `POST /auth/password-recovery` | `{ email }` | Responde `202` con mensaje genérico. |
| ✅ | `POST /auth/password-reset` | `{ token, password }` | Responde `204`. |
| ✅ | `POST /auth/logout` | — (con Bearer) | Responde `204` e invalida la sesión. |
| ✅ | `POST /auth/oauth` | `{ idToken }` de Firebase | Intercambia el ID token por la sesión JWT del backend. |

**Reglas de OAuth (HU-SE-08)**
- **Primera vez:** se crea el usuario con los datos del proveedor.
- **Siguientes accesos:** se identifica al mismo usuario, sin crear otro.
- **Correo que ya existe con correo y contraseña:** se rechaza con `?error=...`.

**Enlace de recuperación:** el correo debe apuntar a `http://localhost:5173/reset-password?token=<token>`.

> El frontend usa `/auth/me` como fuente principal. Como el backend devuelve los
> roles como nombres, consulta además `/user-roles/users/{id}` para recuperar
> sus identificadores y conservar la navegación de administración.

---

## 4. Endpoints existentes que usa el front

| | Método y URL | Uso en el front | Notas |
|---|---|---|---|
| ✅ | `GET /users` | Lista de Usuarios | Agregar `active`, `authProvider` y `twoFactorEnabled` a `UserResponseDTO` (sección 5). |
| ✅ | `GET /users/{id}` | Perfil de otro usuario | — |
| ✅ | `POST /users` | "Nuevo usuario" (admin) | — |
| ✅ | `PUT /users/{id}` | Editar usuario | El front **no envía `password`** si no se cambia; hoy es opcional en `UpdateUserDTO`, así que funciona. |
| ✅ | `PUT /users/{id}/status` | Activar/desactivar | `{ active }` → `UserResponseDTO`. |
| ✅ | `GET /profile/me` | Perfil propio | Devuelve `UserDetailResponseDTO` con `profile` anidado. |
| ✅ | `GET /users/{id}/profile` | Perfil de otro usuario | Devuelve `UserDetailResponseDTO`. |
| ✅ | `POST` / `PUT` `/users/{id}/profile` | Guardar perfil administrativo | Envía `{ phone, birthDate, photoUrl }`. |
| ✅ | `PUT /profile/me` | Guardar perfil propio | Envía `{ phone, birthDate, photoUrl }`. |
| ✅ | `GET /roles` · `GET /roles/{id}` | Roles, matriz, usuarios del rol | — |
| ✅ | `POST /roles` · `PUT /roles/{id}` | Formulario de rol | Envía `{ name, description }`. |
| ✅ | `DELETE /roles/{id}` | Eliminar rol | Si tiene usuarios: 409 `"No se puede eliminar el rol porque tiene usuarios asignados."` (el front también lo verifica antes). |
| ✅ | `GET /permissions` | Permisos y matriz | — |
| ✅ | `POST /permissions` · `PUT /permissions/{id}` | Formulario de permiso | Envía `{ url, method, model }`; el frontend deduce recurso y operación para la matriz. |
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
| `User` | `authMethod` | `"LOCAL" \| "OAUTH"` | El backend informa si la cuenta usa credenciales o un proveedor externo |
| `User` | `twoFactorEnabled` | boolean | HU-SE-10 |
| `Permission` | `operation` (y opcional `resource`) | string | Ver la sección 4 |
| `Profile` | `photoUrl` | texto largo (data URL) | HU-SE-02 |

Si un campo no llega, el front usa estos valores por defecto: `active: true`, `authProvider: "local"`, `twoFactorEnabled: false`.

---

## 6. Permisos requeridos por el backend (`DatabaseSeeder`)

`DynamicAuthorizationManager` exige un permiso para **cada** URL administrativa.
Si el seeder no los crea, el administrador recibirá **403** en:

- `GET/POST /api/user-roles`, `GET /api/user-roles/users/{id}`, `GET /api/user-roles/roles/{id}`, `DELETE /api/user-roles/{id}/{id}`
- `GET/POST /api/role-permissions`, `GET /api/role-permissions/roles/{id}`, `GET /api/role-permissions/permissions/{id}`, `DELETE /api/role-permissions/{id}/{id}`
- `GET /api/users/{id}/detail*`, `GET /api/roles/{id}/detail-with-permissions`
- `GET/POST/PUT /api/users/{id}/profile`
- `PUT /api/users/{id}/status`

Ojo: `normalizeUrl` cambia **todos** los números por `{id}`, así que `/api/user-roles/5/2` queda como `/api/user-roles/{id}/{id}`. Los permisos sembrados deben usar esa forma.

Además, **todo usuario autenticado** (sin importar su rol) debe poder usar estas rutas:
- `/auth/me`, `/auth/logout` y `/auth/2fa-settings`;
- el **perfil propio**, es decir, cuando el `{userId}` de la URL coincide con el `sub` del token.

---

## 7. Otras diferencias detectadas

- **Contraseña:** el backend exige además un **carácter especial** (`@$!%*?&`) y no permite espacios. El front ya valida exactamente la misma regla, así que conviene no cambiarla sin avisar.
- **Perfil:** `birthDate` es obligatorio en `ProfileRequestDTO`, así que el formulario de perfil lo pide. Si el equipo decide que no sea obligatorio, avisar para quitar el `*`.
- **Login:** el backend rechaza cuentas desactivadas antes de crear la sesión.
- **Sesiones:** el backend invalida la sesión en logout y el frontend valida
  `/auth/me` al restaurar una sesión guardada.
