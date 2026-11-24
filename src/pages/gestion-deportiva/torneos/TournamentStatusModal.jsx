import { useState } from 'react'
import { Modal } from '../../../components/Modal'
import { Spinner } from '../../../components/Spinner'
import { useToast } from '../../../hooks/useToast'
import { torneosService } from '../../../services'
import { getApiErrorMessage } from '../../../utils/apiError'
import {
  getTournamentStatusLabel,
  tournamentStatusLabels,
  tournamentStatusTransitions,
} from './tournamentStatus'

export function TournamentStatusModal({ tournament, onClose, onChanged }) {
  const toast = useToast()
  const transitions = tournamentStatusTransitions[tournament.estado] ?? []
  const [selected, setSelected] = useState(transitions[0] ?? '')
  const [saving, setSaving] = useState(false)

  const changeStatus = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await torneosService.changeStatus(tournament.id, selected)
      toast.success(`Estado cambiado a ${tournamentStatusLabels[selected].toLowerCase()}.`)
      onChanged()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo cambiar el estado del torneo.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Cambiar estado del torneo" onClose={saving ? () => {} : onClose} size="sm">
      <div className="modal-body">
        <p>
          Estado actual: <strong>{getTournamentStatusLabel(tournament)}</strong>
        </p>
        <label className="field">
          <span>Nuevo estado <span className="required">*</span></span>
          <select
            className="input"
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            disabled={saving}
          >
            {transitions.map((estado) => (
              <option key={estado} value={estado}>{tournamentStatusLabels[estado]}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn" onClick={onClose} disabled={saving}>Cancelar</button>
        <button
          type="button"
          className={`btn ${selected === 'CANCELADO' ? 'btn-danger' : 'btn-primary'}`}
          onClick={changeStatus}
          disabled={saving || !selected}
        >
          {saving && <Spinner size={16} />}
          Cambiar estado
        </button>
      </div>
    </Modal>
  )
}
