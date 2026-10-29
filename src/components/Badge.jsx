// Estado de un registro: Activo (verde) / Inactivo (gris)
export function StatusBadge({ active }) {
  return (
    <span className={`badge ${active ? 'badge-success' : 'badge-muted'}`}>
      <span className="badge-dot" aria-hidden="true" />
      {active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

// Método HTTP de un permiso, cada uno con su color
export function MethodBadge({ method }) {
  return <span className={`badge badge-method method-${method.toLowerCase()}`}>{method}</span>
}

// Etiqueta simple, por ejemplo para los roles de un usuario
export function Chip({ children }) {
  return <span className="chip">{children}</span>
}
