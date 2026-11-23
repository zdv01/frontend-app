# Guía de Implementación Exacta - Nicolás (Persona A)

Este documento detalla estrictamente las clases, archivos y componentes que debes crear para cumplir con tus historias de usuario (HU-GD-01, HU-GD-02, HU-GD-03, HU-GC-01, HU-GC-02 y Extra Fase 0).

## 1. BACKEND (`ms-gestion-deportiva`)

*Nota: Por acuerdos del equipo (ACUERDOS.md), el código, variables y archivos del backend deben ir estrictamente en español (kebab-case).*

### 1.1 Módulo: `deporte/` (HU-GD-01)
*Nota: Este módulo es solo backend (pruebas en Postman).*
* **Entidad:** `entities/deporte.entity.ts` (`@Entity('deporte')`)
* **Controlador:** `deporte.controller.ts` (`@Controller('deportes')`)
* **Servicio:** `deporte.service.ts`
* **DTOs (`dto/`):** `crear-deporte.dto.ts`, `actualizar-deporte.dto.ts`, `deporte-response.dto.ts`
* **Mapper:** `mappers/deporte.mapper.ts`

### 1.2 Módulo: `equipo/` (HU-GD-02 y HU-GD-03)
* **Entidades:** `entities/equipo.entity.ts`, `entities/equipo-deporte.entity.ts`
* **Controladores:** `equipo.controller.ts`, `equipo-deporte.controller.ts`
* **Servicios:** `equipo.service.ts`, `equipo-deporte.service.ts`
* **DTOs (`dto/`):** `crear-equipo.dto.ts`, `actualizar-equipo.dto.ts`, `equipo-response.dto.ts`
* **Mapper:** `mappers/equipo.mapper.ts`

### 1.3 Módulo: `torneo/` (HU-GC-01 y HU-GC-02)
* **Entidades:** `entities/torneo.entity.ts`, `entities/inscripcion.entity.ts`, `entities/estado-torneo.enum.ts`
* **Controladores:** `torneo.controller.ts`, `inscripcion.controller.ts`
* **Servicios:** `torneo.service.ts`, `inscripcion.service.ts`
* **DTOs (`dto/`):** `crear-torneo.dto.ts`, `actualizar-torneo.dto.ts`, `torneo-response.dto.ts`, `inscripcion-response.dto.ts`
* **Mappers:** `mappers/torneo.mapper.ts`, `mappers/inscripcion.mapper.ts`

### 1.4 Módulo: `escenario/` (Extra Fase 0)
* **Entidad:** `entities/escenario.entity.ts`
* **Controlador:** `escenario.controller.ts` (Solo GET)
* **Servicio:** `escenario.service.ts`

---

## 2. FRONTEND (`frontend-app`)

*Nota: Estructura de componentes, archivos y servicios en inglés, de acuerdo con las convenciones del repositorio frontend-app.*

### 2.1 Servicios API (`src/services/sports/`)
Configuración de llamadas a `VITE_GESTION_API_URL`.
* `catalogsService.js`: Funciones `getSports()` y `getVenues()`. (Usado para llenar los selectores).
* `teamsService.js`: Funciones CRUD (`getTeams`, `getTeam`, `createTeam`, `updateTeam`, `changeTeamStatus`, `assignSport`, `removeSport`).
* `tournamentsService.js`: Funciones CRUD (`getTournaments`, `getTournament`, `createTournament`, `updateTournament`, `changeTournamentStatus`, `enrollTeams`, `removeEnrollment`).

### 2.2 Páginas / Vistas Principales (`src/pages/sports/`)
* `teams/TeamsList.jsx` (Ruta: `/teams`): Tabla `DataTable` con CRUD de equipos.
* `teams/TeamDetail.jsx` (Ruta: `/teams/:id`): Vista con la información del equipo y contenedores para incrustar componentes.
* `tournaments/TournamentsList.jsx` (Ruta: `/tournaments`): Tabla `DataTable` con CRUD de torneos y select de deportes.
* `tournaments/TournamentDetail.jsx` (Ruta: `/tournaments/:id`): Vista con info del torneo, estado y botones de cambio de estado.

### 2.3 Componentes Específicos de tu propiedad (`src/pages/sports/components/` o dentro de las subcarpetas)
Estos componentes se incrustan en tus vistas de detalle.
* `TeamSports.jsx`: Componente incrustado en `TeamDetail.jsx`. Muestra lista de deportes asignados y permite agregar/quitar (HU-GD-03).
* `TeamTournaments.jsx`: Componente incrustado en `TeamDetail.jsx`. Lista de solo lectura de los torneos donde el equipo está inscrito.
* `TournamentInscriptions.jsx`: Componente incrustado en `TournamentDetail.jsx`. Muestra tabla de equipos inscritos y selector multi-select para inscribir nuevos (HU-GC-02).

### 2.4 Puntos de Inserción para tus compañeros (Placeholders)
Debes agregar estos componentes en tus vistas para que B (Adrián) y C (Andrei) los llenen luego:
* En `TeamDetail.jsx`: Invocar `<TeamRoster teamId={id} />` (Componente de plantilla de Adrián).
* En `TournamentDetail.jsx`: Invocar `<TournamentMatches tournamentId={id} />` (Componente de partidos de Adrián).
* En `TournamentDetail.jsx`: Botones/Links hacia `/tournaments/:id/final-phase` y `/tournaments/:id/development` (Vistas de Andrei).

---

## 3. CONFIGURACIÓN COMPARTIDA (Fase 0 - Tu responsabilidad)

Archivos core que tú debes crear o modificar para habilitar el ecosistema:
* **Backend:** `common/notificacion/correo.service.ts` y `destinatarios.service.ts`.
* **Backend:** `common/dto/` (Crear interfaces base `EstadoDto`, `EquipoResumen`, `TorneoResumen`, etc).
* **Frontend:** `src/constants/permissions.js`: Registrar los keys de permisos (ej. `teams`, `tournaments`, `sports`, `venues`).
* **Frontend:** `src/routes/router.jsx`: Configurar las rutas para `/teams` y `/tournaments` protegidas con el wrapper `<RequirePermission>`.