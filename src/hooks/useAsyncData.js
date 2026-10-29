import { useCallback, useEffect, useState } from 'react'

/*
 * Carga datos de un servicio y avisa si están cargando o si hubo error.
 *
 *   const loadUsers = useCallback(() => usersService.list(), [])
 *   const { data, loading, error, reload } = useAsyncData(loadUsers)
 *
 * Importante: el "loader" debe venir de useCallback; si cambia, los datos se vuelven a pedir.
 */
export function useAsyncData(loader) {
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState({ data: null, error: null, loader: null, version: -1 })

  useEffect(() => {
    let active = true
    loader().then(
      (data) => active && setResult({ data, error: null, loader, version }),
      (error) => active && setResult({ data: null, error, loader, version }),
    )
    // Si el componente se desmonta o se pide otra carga, se ignora la respuesta vieja
    return () => {
      active = false
    }
  }, [loader, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  // Está cargando mientras la última respuesta no corresponda a la petición actual
  const loading = result.loader !== loader || result.version !== version
  // Mientras se recarga, se siguen mostrando los datos anteriores (si son del mismo loader)
  const data = result.loader === loader ? result.data : null

  return { data, error: loading ? null : result.error, loading, reload }
}
