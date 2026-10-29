import { useCallback, useState } from 'react'
import { StatusBadge } from '../../components/Badge'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Modal } from '../../components/Modal'
import { Spinner } from '../../components/Spinner'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { rolesService, userRolesService } from '../../services'
import { getApiErrorMessage } from '../../utils/apiError'

// HU-SE-04 desde el lado del usuario: asignar o retirar sus roles
export function UserRolesModal({ user, onClose, onChanged }) {
  const { user: currentUser, refreshSession } = useAuth()
  const toast = useToast()
  const [busyRoleId, setBusyRoleId] = useState(null)
  const [removeTarget, setRemoveTarget] = useState(null)

  const loader = useCallback(
    () => Promise.all([rolesService.list(), userRolesService.listRolesByUser(user.id)]),
    [user.id],
  )
  const { data, loading, error, reload } = useAsyncData(loader)
  const [allRoles, userRoles] = data ?? [[], []]
  const assignedIds = new Set(userRoles.map((role) => role.id))

  const afterChange = async () => {
    reload()
    onChanged()
    // Si me cambié mis propios roles, mis permisos efectivos cambian
    if (user.id === currentUser.id) await refreshSession()
  }

  const assign = async (role) => {
    setBusyRoleId(role.id)
    try {
      await userRolesService.assign(user.id, role.id)
      toast.success(`Rol "${role.name}" asignado a ${user.name}.`)
      await afterChange()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo asignar el rol.'))
    } finally {
      setBusyRoleId(null)
    }
  }

  const remove = async () => {
    const role = removeTarget
    setBusyRoleId(role.id)
    try {
      await userRolesService.remove(user.id, role.id)
      toast.success(`Rol "${role.name}" retirado de ${user.name}.`)
      await afterChange()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo retirar el rol.'))
    } finally {
      setBusyRoleId(null)
      setRemoveTarget(null)
    }
  }

  return (
    <Modal title={`Roles de ${user.name}`} onClose={onClose}>
      <div className="modal-body">
        <p className="text-muted">
          Un usuario puede tener varios roles. Sus permisos efectivos son la suma de los permisos
          de todos sus roles.
        </p>
        {loading && !data ? (
          <Spinner label="Cargando roles..." />
        ) : error ? (
          <p className="field-error">{getApiErrorMessage(error)}</p>
        ) : (
          <div className="select-list">
            {allRoles.map((role) => {
              const assigned = assignedIds.has(role.id)
              return (
                <div key={role.id} className="select-list-item">
                  <div className="select-list-text">
                    <strong>{role.name}</strong>
                    <span className="text-muted">{role.description}</span>
                  </div>
                  {!role.active && <StatusBadge active={false} />}
                  {assigned ? (
                    <button
                      type="button"
                      className="btn"
                      disabled={busyRoleId !== null}
                      onClick={() => setRemoveTarget(role)}
                    >
                      Retirar
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={busyRoleId !== null}
                      onClick={() => assign(role)}
                    >
                      {busyRoleId === role.id && <Spinner size={14} />}
                      Asignar
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button type="button" className="btn" onClick={onClose}>
          Cerrar
        </button>
      </div>

      {removeTarget && (
        <ConfirmDialog
          title="Retirar rol"
          confirmLabel="Retirar"
          loading={busyRoleId !== null}
          onConfirm={remove}
          onCancel={() => setRemoveTarget(null)}
          message={
            <p>
              ¿Retirar el rol <strong>{removeTarget.name}</strong> de {user.name}? El usuario y el
              rol seguirán existiendo; solo se elimina la asignación.
            </p>
          }
        />
      )}
    </Modal>
  )
}
