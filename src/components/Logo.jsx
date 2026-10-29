import { Shield, Trophy } from 'lucide-react'
import './Logo.css'

export function Logo() {
  return (
    <div className="logo">
      <span className="logo-mark" aria-hidden="true">
        <Shield size={40} strokeWidth={1.5} />
        <Trophy size={16} strokeWidth={2} className="logo-mark-inner" />
      </span>
      <span className="logo-text">
        <span className="logo-name">
          <span className="logo-name-accent">SPORT</span>MANAGER
        </span>
        <span className="logo-tagline">Plataforma administrativa</span>
      </span>
    </div>
  )
}
