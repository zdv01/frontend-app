import { LoaderCircle } from 'lucide-react'

export function Spinner({ size = 20, label }) {
  return (
    <span className="spinner" role={label ? 'status' : undefined}>
      <LoaderCircle size={size} className="spinner-icon" aria-hidden="true" />
      {label && <span>{label}</span>}
    </span>
  )
}
