import { PartidosList } from './PartidosList'

// Componente incrustable en /torneos/:id (lo inserta A): <PartidosTorneo torneoId={id} />
// Es la misma lista de partidos, ya filtrada por el torneo y con el botón "Nuevo partido".
export function PartidosTorneo({ torneoId }) {
  return <PartidosList torneoId={torneoId} />
}
