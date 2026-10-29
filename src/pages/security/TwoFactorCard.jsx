import { Fingerprint } from 'lucide-react'
import { useState } from 'react'
import { Switch } from '../../components/Switch'
import { getProviderLabel } from '../../constants/auth'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { profileService } from '../../services'
import { getApiErrorMessage } from '../../utils/apiError'

/*
 * HU-SE-10: activar o desactivar la verificación en dos pasos.
 * Solo aplica a cuentas con correo y contraseña; en cuentas OAuth la seguridad
 * la gestiona el proveedor (Google, GitHub, Microsoft).
 */
export function TwoFactorCard() {
  const { user, updateUser } = useAuth()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const isLocal = user.authProvider === 'local'

  const handleChange = async (enabled) => {
    setSaving(true)
    try {
      const result = await profileService.setTwoFactor(user.id, enabled)
      updateUser({ twoFactorEnabled: result.twoFactorEnabled })
      toast.success(
        enabled
          ? 'Verificación en dos pasos activada. Te pediremos un código al iniciar sesión.'
          : 'Verificación en dos pasos desactivada.',
      )
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo cambiar la verificación en dos pasos.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="panel two-factor-card">
      <Fingerprint size={32} className="two-factor-icon" aria-hidden="true" />
      <div className="two-factor-text">
        <h2 className="section-title">Verificación en dos pasos (2FA)</h2>
        {isLocal ? (
          <p className="text-muted">
            Al iniciar sesión, además de tu contraseña te enviaremos un código a tu correo.
          </p>
        ) : (
          <p className="text-muted">
            Ingresas con {getProviderLabel(user.authProvider)}, así que la seguridad de tu cuenta
            la gestiona ese proveedor y no necesitas la verificación de la plataforma.
          </p>
        )}
      </div>
      {isLocal && (
        <Switch
          id="two-factor-switch"
          checked={user.twoFactorEnabled}
          onChange={handleChange}
          disabled={saving}
          label={user.twoFactorEnabled ? 'Activada' : 'Desactivada'}
        />
      )}
    </section>
  )
}
