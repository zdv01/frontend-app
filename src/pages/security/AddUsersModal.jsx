import { Search } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { Modal } from '../../components/Modal'
import { Spinner } from '../../components/Spinner'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useToast } from '../../hooks/useToast'
import { userRolesService, usersService } from '../../services'
import { getApiErrorMessage } from '../../utils/apiError'
import { matchesSearch } from '../../utils/format'

/*
 * Muestra solo los usuarios DISPONIBLES (activos y que aún no tienen el rol),
 * así no se puede asignar dos veces el mismo rol al mismo usuario.
 */
export function AddUsersModal({ role, assignedIds, onClose, onAdded }) {
  const toast = useToast()
  const loadUsers = useCallback(() => usersService.list(), [])
  const { data: users, loading, error } = useAsyncData(loadUsers)

  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(() => new Set())
  const [saving, setSaving] = useState(false)

  const available = useMemo(
    () =>
      (users ?? []).filter(
        (u) => u.active && !assignedIds.includes(u.id) && matchesSearch(search, u.name, u.email),
      ),
    [users, assignedIds, search],
  )

  const toggle = (userId) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const added = []
    try {
      // De uno en uno, igual que el endpoint POST /api/user-roles
      for (const userId of selected) {
        await userRolesService.assign(userId, role.id)
        added.push(userId)
      }
      toast.success(
        added.length === 1
          ? `Se agregó 1 usuario al rol ${role.name}.`
          : `Se agregaron ${added.length} usuarios al rol ${role.name}.`,
      )
      await onAdded(added)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudieron agregar todos los usuarios.'))
      setSaving(false)
      if (added.length) await onAdded(added)
    }
  }

  return (
    <Modal title={`Agregar usuarios a ${role.name}`} onClose={onClose}>
      <div className="modal-body">
        <label className="search-box">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre o correo"
            aria-label="Buscar usuarios disponibles"
            autoFocus
          />
        </label>

        {loading ? (
          <Spinner label="Cargando usuarios..." />
        ) : error ? (
          <p className="field-error">{getApiErrorMessage(error)}</p>
        ) : available.length === 0 ? (
          <p className="text-muted">No hay usuarios disponibles para agregar a este rol.</p>
        ) : (
          <div className="select-list">
            {available.map((user) => (
              <label key={user.id} className="select-list-item">
                <input
                  type="checkbox"
                  checked={selected.has(user.id)}
                  onChange={() => toggle(user.id)}
                />
                <Avatar name={user.name} size={32} />
                <span className="select-list-text">
                  <strong>{user.name}</strong>
                  <span className="text-muted">{user.email}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="modal-footer">
        <button type="button" className="btn" onClick={onClose} disabled={saving}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving || selected.size === 0}
        >
          {saving && <Spinner size={16} />}
          Agregar {selected.size > 0 ? `(${selected.size})` : ''}
        </button>
      </div>
    </Modal>
  )
}
