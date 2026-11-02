import {
  deriveOperation,
  modelFromResource,
  permissionKey,
  resourceFromModel,
} from '../constants/permissions'

/*
 * Traducen los JSON del backend al formato que usan las pantallas (y al revés).
 * Si el backend todavía no envía un campo (active, authProvider...), se usa un valor por defecto.
 */
export function toUser(dto) {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    active: dto.active ?? dto.enabled ?? true,
    authProvider: dto.authProvider ?? 'local',
    twoFactorEnabled: dto.twoFactorEnabled ?? false,
  }
}

export function toRole(dto) {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    active: dto.active ?? true,
  }
}

// El backend guarda url, method y model; recurso y operación se deducen si no vienen
export function toPermission(dto) {
  return {
    id: dto.id,
    url: dto.url,
    method: dto.method,
    model: dto.model,
    resource: dto.resource ?? resourceFromModel(dto.model),
    operation: dto.operation ?? deriveOperation(dto.method, dto.url),
    active: dto.active ?? true,
  }
}

export function toPermissionPayload({ resource, method, url }) {
  return {
    url: url.trim(),
    method: method.toUpperCase(),
    model: modelFromResource(resource),
  }
}

export function toPermissionKey(dto) {
  const permission = toPermission(dto)
  return permissionKey(permission.resource, permission.operation)
}

export function toProfile(dto) {
  return {
    phone: dto.phone ?? '',
    birthDate: dto.birthDate ?? '',
    photo: dto.photo ?? dto.photoUrl ?? null,
  }
}
