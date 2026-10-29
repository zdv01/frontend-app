import { getInitials } from '../utils/format'

// Foto del usuario o, si no tiene, sus iniciales en un círculo
export function Avatar({ name, photo, size = 40, online = false }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {photo ? <img src={photo} alt="" /> : getInitials(name)}
      {online && <span className="avatar-dot" aria-hidden="true" />}
    </span>
  )
}
