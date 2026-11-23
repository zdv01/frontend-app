# Interfaces DTO (Data Transfer Objects) para el Frontend

Este documento define el formato exacto de los datos que el frontend (React) enviará al backend (NestJS) y la estructura de las respuestas esperadas para las historias de usuario asignadas a Nico.

## 0. Formato Base de Respuestas HTTP
Basado en las buenas prácticas de `ms-cinema`, todas las respuestas del backend deberían venir envueltas en este formato estándar:

```typescript
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T; // Aquí vendrá el DTO o arreglo de DTOs
}
```

---

## 1. Módulo: Deportes (Solo lectura en Frontend)
*Aplica para poblar los `select` al crear torneos o asociar equipos.*

```typescript
// GET /deportes
export interface DeporteResponseDto {
  id: string; // o number dependiendo de tu DB
  nombre: string;
  descripcion: string;
  estado: string; // Ej: 'ACTIVO', 'INACTIVO'
  padreId?: string | null; // Para la relación de subdeportes (ej. Fútbol -> Fútbol de salón)
}
```

---

## 2. Módulo: Equipos (HU-GD-02)

```typescript
// POST /equipos (Body enviado desde React)
export interface CreateEquipoDto {
  nombre: string;
  fecha_fundacion: string; // Formato YYYY-MM-DD
  estado: string; // Ej: 'ACTIVO'
}

// PUT /equipos/:id (Body enviado desde React)
export interface UpdateEquipoDto extends Partial<CreateEquipoDto> {}

// GET /equipos y Respuesta de POST/PUT
export interface EquipoResponseDto {
  id: string;
  nombre: string;
  fecha_fundacion: string;
  estado: string;
}
```

---

## 3. Módulo: Asociación Equipo-Deporte (HU-GD-03)

```typescript
// POST /equipos/:idEquipo/deportes/:idDeporte
// Generalmente no requiere body, los IDs van en la URL, pero si necesitan enviar datos extra:
export interface AsociarEquipoDeporteDto {
  equipoId: string;
  deporteId: string;
}

// GET /equipos/:idEquipo/deportes (Retorna los deportes de un equipo)
// Responde con un ApiResponse<DeporteResponseDto[]>

// GET /deportes/:idDeporte/equipos (Retorna los equipos de un deporte)
// Responde con un ApiResponse<EquipoResponseDto[]>
```

---

## 4. Módulo: Torneos (HU-GC-01)

```typescript
// POST /torneos (Body enviado desde React)
export interface CreateTorneoDto {
  nombre: string;
  fecha_inicio: string; // Formato YYYY-MM-DD
  fecha_fin: string;    // Formato YYYY-MM-DD
  deporteId: string;    // ID del deporte al que pertenece
}

// PUT /torneos/:id
export interface UpdateTorneoDto extends Partial<CreateTorneoDto> {
  estado?: string; // Ej: 'PROGRAMADO', 'EN_CURSO', 'FINALIZADO'
}

// GET /torneos y Respuesta de POST/PUT
export interface TorneoResponseDto {
  id: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  deporteId: string;
  estado: string;
  // Opcional: Si el backend hace un JOIN/Populate
  deporte?: DeporteResponseDto; 
}
```

---

## 5. Módulo: Inscripciones (HU-GC-02)

```typescript
// POST /torneos/:idTorneo/inscripciones (Body enviado desde React)
export interface InscribirEquipoDto {
  equipoId: string;
}

// GET /torneos/:idTorneo/inscripciones (Retorna los equipos inscritos)
export interface InscripcionResponseDto {
  id: string;
  torneoId: string;
  equipoId: string;
  fecha_inscripcion: string;
  // Opcional: Si el backend hace un JOIN/Populate para mostrar info completa en la tabla
  equipo?: EquipoResponseDto; 
}
```

---

## 6. Módulo: Escenario (Fase 0 - Mínimo Viable)

```typescript
// POST /escenarios
export interface CreateEscenarioDto {
  nombre: string;
  ubicacion: string;
  capacidad?: number;
}

// GET /escenarios
export interface EscenarioResponseDto {
  id: string;
  nombre: string;
  ubicacion: string;
  capacidad: number;
}
```