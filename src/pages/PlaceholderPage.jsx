import { Construction } from 'lucide-react'
import { usePageMeta } from '../hooks/usePageMeta'
import './PlaceholderPage.css'

// Pantalla provisional: se reemplaza por la pantalla real cuando se construya
export function PlaceholderPage() {
  const { title } = usePageMeta()

  return (
    <div className="placeholder">
      <Construction size={40} className="placeholder-icon" aria-hidden="true" />
      <h2 className="section-title">{title}</h2>
      <p className="text-muted">Esta pantalla se construirá en el siguiente paso.</p>
    </div>
  )
}
