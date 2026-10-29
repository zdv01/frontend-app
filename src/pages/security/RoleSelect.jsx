import { Check, ChevronDown, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

// Selector desplegable de rol con icono y ✓ en el elegido (como en el mockup)
export function RoleSelect({ roles, value, onChange, disabled = false }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const selected = roles.find((role) => role.id === value)

  // Se cierra al hacer clic fuera o con Escape
  useEffect(() => {
    if (!open) return undefined
    const handleClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div className="role-select" ref={containerRef}>
      <button
        type="button"
        className="role-select-button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <UserRound size={18} aria-hidden="true" />
        <span>{selected?.name ?? 'Selecciona un rol'}</span>
        <ChevronDown size={18} aria-hidden="true" />
      </button>

      {open && (
        <ul className="role-select-list" role="listbox" aria-label="Roles">
          {roles.map((role) => {
            const isSelected = role.id === value
            return (
              <li key={role.id} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  className={isSelected ? 'is-selected' : ''}
                  onClick={() => {
                    setOpen(false)
                    onChange(role.id)
                  }}
                >
                  <UserRound size={18} aria-hidden="true" />
                  <span>
                    {role.name}
                    {!role.active && <span className="text-muted"> (inactivo)</span>}
                  </span>
                  {isSelected && <Check size={18} className="role-select-check" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
