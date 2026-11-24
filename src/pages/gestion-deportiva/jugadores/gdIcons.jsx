// Etiqueta con icono para las filas de detalle: <DetailRow label={iconLabel(Mail, 'Correo')}>
// (archivo aparte porque gdUi.jsx solo exporta componentes)
export function iconLabel(Icon, text) {
  return (
    <>
      <Icon size={16} aria-hidden="true" />
      {text}
    </>
  )
}
