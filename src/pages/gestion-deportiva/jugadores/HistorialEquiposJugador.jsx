import { History } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Alert } from '../../../components/Alert'
import { Spinner } from '../../../components/Spinner'
import { Switch } from '../../../components/Switch'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { jugadoresService } from '../../../services/gestion/jugadoresService'
import { ActivoBadge } from './gdUi'
import './gd.css'

const shortDate = (v) => (v ? v.split('-').reverse().join('/') : '—')

// Equipos del jugador (GET /api/jugadores/{id}/equipos). Con el interruptor se incluye el historial.
export function HistorialEquiposJugador({ jugadorId }) {
  const [incluirHistorial, setIncluirHistorial] = useState(false)
  const load = useCallback(() => jugadoresService.listContratosJugador(jugadorId, incluirHistorial), [jugadorId, incluirHistorial])
  const { data, loading, error } = useAsyncData(load)
  const contratos = data ?? []

  return (
    <section className="panel team-section gd-skin">
      <div className="gd-panel-head">
        <h3 className="section-title gd-panel-title"><History size={20} /> Equipos del jugador</h3>
        <Switch id="hist-equipos" checked={incluirHistorial} onChange={setIncluirHistorial} label="Incluir historial" />
      </div>
      {error && <Alert type="error">No se pudieron cargar los equipos.</Alert>}
      {loading && !data ? <Spinner label="Cargando..." /> : (
        <div className="table-card">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>Equipo</th><th>Período</th><th>Retiro</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {contratos.map((c) => (
                  <tr key={c.id}>
                    <td className="gd-nowrap"><strong>{c.equipo.nombre}</strong></td>
                    <td className="gd-nowrap">{shortDate(c.fechaInicio)} – {shortDate(c.fechaFin)}</td>
                    <td>{c.fechaRetiro ? `Retirado el ${shortDate(c.fechaRetiro)}` : '—'}</td>
                    <td><ActivoBadge active={c.activo} inactiveLabel="Finalizado" /></td>
                  </tr>
                ))}
                {contratos.length === 0 && <tr><td colSpan="4" className="table-message">Sin contratos.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
