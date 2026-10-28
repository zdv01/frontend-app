const apiUrl = import.meta.env.VITE_API_URL

export async function apiClient(path, options = {}) {
  const { headers, ...requestOptions } = options
  const response = await fetch(`${apiUrl}${path}`, {
    ...requestOptions,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}
