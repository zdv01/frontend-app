// Interruptor encendido/apagado (por ejemplo, activar 2FA o el estado de un registro)
export function Switch({ id, checked, onChange, disabled = false, label }) {
  return (
    <label className={`switch ${disabled ? 'switch-disabled' : ''}`} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
      />
      <span className="switch-track" aria-hidden="true">
        <span className="switch-thumb" />
      </span>
      {label && <span className="switch-label">{label}</span>}
    </label>
  )
}
