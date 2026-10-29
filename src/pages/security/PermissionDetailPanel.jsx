import { Pencil } from 'lucide-react'
import { useCallback } from 'react'
import { Chip, MethodBadge, StatusBadge } from '../../components/Badge'
import { DetailPanel, DetailRow } from '../../components/DetailPanel'
import { Spinner } from '../../components/Spinner'
import { getOperationLabel, getResource } from '../../constants/permissions'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAuth } from '../../hooks/useAuth'
import { rolePermissionsService } from '../../services'

// Panel derecho de Permisos: datos del permiso y roles que lo tienen asignado
export function PermissionDetailPanel({ permission, onClose, onEdit }) {
  const { can } = useAuth()
  const resource = getResource(permission.resource)

  const loader = useCallback(
    () => rolePermissionsService.listRolesByPermission(permission.id),
    [permission.id],
  )
  const { data: roles, loading } = useAsyncData(loader)

  return (
    <DetailPanel
      title="Detalle del permiso"
      onClose={onClose}
      actions={
        can('permisos', 'actualizar') && (
          <button type="button" className="btn" onClick={onEdit}>
            <Pencil size={18} /> Editar permiso
          </button>
        )
      }
    >
      <dl>
        <DetailRow label="Recurso">{resource?.label ?? permission.resource}</DetailRow>
        <DetailRow label="Módulo">{resource?.moduleLabel ?? 'Otros'}</DetailRow>
        <DetailRow label="Operación">{getOperationLabel(permission.operation)}</DetailRow>
        <DetailRow label="Método">
          <MethodBadge method={permission.method} />
        </DetailRow>
        <DetailRow label="URL">
          <span className="mono">{permission.url}</span>
        </DetailRow>
        <DetailRow label="Estado">
          <StatusBadge active={permission.active} />
        </DetailRow>
      </dl>

      <div>
        <p className="detail-section-title">Roles con este permiso</p>
        {loading ? (
          <Spinner size={16} />
        ) : roles?.length ? (
          <div className="chip-list">
            {roles.map((role) => (
              <Chip key={role.id}>{role.name}</Chip>
            ))}
          </div>
        ) : (
          <p className="text-muted">Ningún rol tiene este permiso.</p>
        )}
      </div>
    </DetailPanel>
  )
}
