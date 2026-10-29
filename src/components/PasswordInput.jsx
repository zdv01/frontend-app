import { Check, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { PASSWORD_RULES } from '../utils/validators'

// Campo de contraseña con botón para mostrarla u ocultarla
export function PasswordInput({ id, name, value, onChange, autoComplete = 'current-password', invalid }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="password-input">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        className="input"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
      />
      <button
        type="button"
        className="btn btn-icon password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}

// Lista de reglas de la contraseña que se van marcando en verde mientras se escribe
export function PasswordChecklist({ password }) {
  return (
    <ul className="password-rules" aria-label="Requisitos de la contraseña">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password)
        return (
          <li key={rule.id} className={ok ? 'rule-ok' : ''}>
            <Check size={14} aria-hidden="true" />
            {rule.label}
          </li>
        )
      })}
    </ul>
  )
}
