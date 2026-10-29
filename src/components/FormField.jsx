/*
 * Envoltorio de un campo de formulario: etiqueta, asterisco rojo si es obligatorio,
 * el input (children), una pista opcional y el mensaje de error en rojo debajo.
 */
export function FormField({ label, htmlFor, required = false, error, hint, children }) {
  return (
    <div className={`field ${error ? 'field-invalid' : ''}`}>
      <label htmlFor={htmlFor}>
        {label}
        {required && <span className="required"> *</span>}
      </label>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
