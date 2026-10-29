/*
 * Botón de icono para la columna "Acciones" de las tablas.
 * variant: 'view' y 'edit' (azul) o 'danger' (rojo).
 * Detiene el clic para que no se seleccione también la fila.
 */
export function ActionButton({ icon: Icon, label, variant = 'view', onClick, disabled = false }) {
  return (
    <button
      type="button"
      className={`action-btn action-${variant}`}
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    >
      <Icon size={18} />
    </button>
  )
}
