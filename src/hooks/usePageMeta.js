import { useMatches } from 'react-router-dom'

// Devuelve el { title, subtitle } definido en la ruta actual (ver routes/router.jsx)
export function usePageMeta() {
  const matches = useMatches()
  const withMeta = matches.filter((match) => match.handle?.title)
  return withMeta.at(-1)?.handle ?? { title: '', subtitle: '' }
}
