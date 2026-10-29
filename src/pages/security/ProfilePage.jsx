import { ArrowLeft } from 'lucide-react'
import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { Avatar } from '../../components/Avatar'
import { Chip, StatusBadge } from '../../components/Badge'
import { DetailRow } from '../../components/DetailPanel'
import { Spinner } from '../../components/Spinner'
import { getProviderLabel } from '../../constants/auth'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAuth } from '../../hooks/useAuth'
import { profileService, userRolesService, usersService } from '../../services'
import { getApiErrorMessage } from '../../utils/apiError'
import { ProfileForm } from './ProfileForm'
import { TwoFactorCard } from './TwoFactorCard'
import './ProfilePage.css'

/*
 * HU-SE-02 + HU-SE-10.
 * /profile               → mi perfil (con el interruptor de 2FA)
 * /users/:userId/profile → perfil de otro usuario (lo abre el administrador desde Usuarios)
 */
export function ProfilePage() {
  const { userId: userIdParam } = useParams()
  const { user: me, updateUser } = useAuth()
  const userId = userIdParam ? Number(userIdParam) : me.id
  const isOwn = userId === me.id

  const loader = useCallback(async () => {
    if (isOwn) {
      return { person: null, roles: null, profile: await profileService.get(userId) }
    }
    const [person, roles, profile] = await Promise.all([
      usersService.get(userId),
      userRolesService.listRolesByUser(userId),
      profileService.get(userId),
    ])
    return { person, roles, profile }
  }, [userId, isOwn])
  const { data, loading, error, reload } = useAsyncData(loader)

  // Para mi propio perfil los datos personales ya están en la sesión
  const person = isOwn ? me : data?.person
  const roles = isOwn ? me.roles : (data?.roles ?? [])

  if (loading && !data) return <Spinner label="Cargando perfil..." />
  if (error) {
    return <Alert type="error">{getApiErrorMessage(error, 'No se pudo cargar el perfil.')}</Alert>
  }

  return (
    <div className="page-stack">
      {!isOwn && (
        <Link to="/users" className="back-link">
          <ArrowLeft size={16} /> Volver a Usuarios
        </Link>
      )}

      <div className="profile-layout">
        <section className="panel profile-card">
          <Avatar name={person.name} photo={isOwn ? me.photo : data.profile?.photo} size={96} />
          <div className="profile-card-name">
            <h2>{person.name}</h2>
            <p className="text-muted">{person.email}</p>
          </div>
          <dl>
            <DetailRow label="Acceso">{getProviderLabel(person.authProvider)}</DetailRow>
            {'active' in person && (
              <DetailRow label="Estado">
                <StatusBadge active={person.active} />
              </DetailRow>
            )}
            <DetailRow label="Roles">
              {roles.length ? (
                <span className="chip-list">
                  {roles.map((role) => (
                    <Chip key={role.id}>{role.name}</Chip>
                  ))}
                </span>
              ) : (
                'Sin roles'
              )}
            </DetailRow>
          </dl>
          <p className="profile-note">
            El correo y la contraseña no se modifican desde el perfil
            {isOwn ? '.' : '; se cambian en la gestión de usuarios.'}
          </p>
        </section>

        <div className="page-stack">
          {/* Al guardar: mi foto se actualiza en la Topbar; la de otro usuario, en la tarjeta */}
          <ProfileForm
            key={userId}
            userId={userId}
            personName={person.name}
            initial={data.profile}
            onSaved={(profile) => (isOwn ? updateUser({ photo: profile.photo }) : reload())}
          />
          {isOwn && <TwoFactorCard />}
        </div>
      </div>
    </div>
  )
}
