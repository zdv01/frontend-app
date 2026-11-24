import { useState } from 'react'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { useToast } from '../../../hooks/useToast'
import { partidosService } from '../../../services/gestion/partidosService'
import { getApiErrorMessage } from '../../../utils/apiError'
import { Enfrentamiento } from './partidosUi'
import { ACCION_ESTADO, estadoLabel } from './partidosUtils'

// Confirma y ejecuta PATCH /partidos/{id}/estado. Los errores del servidor
// (p. ej. finalizar sin resultado) se muestran con su message.
export function CambioEstadoDialog({ partido, estado, onClose, onDone }) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const accion = ACCION_ESTADO[estado]

  const confirmar = async () => {
    setSaving(true)
    try {
      const actualizado = await partidosService.changeStatus(partido.id, estado)
      toast.success(`Partido ${estadoLabel(estado).toLowerCase()} correctamente.`)
      onDone(actualizado)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo cambiar el estado del partido.'))
    } finally {
      setSaving(false)
      onClose()
    }
  }

  return (
    <ConfirmDialog
      title={accion.label}
      danger={estado === 'CANCELADO'}
      confirmLabel={accion.label}
      loading={saving}
      onConfirm={confirmar}
      onCancel={onClose}
      message={(
        <>
          <p><Enfrentamiento partido={partido} /></p>
          <p>El partido pasará de {estadoLabel(partido.estado)} a {estadoLabel(estado)}.{estado === 'FINALIZADO' && ' Se enviará el correo de resumen.'}</p>
        </>
      )}
    />
  )
}

// DELETE /partidos/{id}: si responde 409 HAS_ASSOCIATIONS se muestra su message
export function EliminarPartidoDialog({ partido, onClose, onDone }) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)

  const eliminar = async () => {
    setSaving(true)
    try {
      await partidosService.remove(partido.id)
      toast.success('Partido eliminado correctamente.')
      onDone()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo eliminar el partido.'))
    } finally {
      setSaving(false)
      onClose()
    }
  }

  return (
    <ConfirmDialog
      title="Eliminar partido"
      confirmLabel="Eliminar"
      loading={saving}
      onConfirm={eliminar}
      onCancel={onClose}
      message={(
        <>
          <p><Enfrentamiento partido={partido} /></p>
          <p>Solo se puede eliminar un partido Programado y sin anotaciones.</p>
        </>
      )}
    />
  )
}
