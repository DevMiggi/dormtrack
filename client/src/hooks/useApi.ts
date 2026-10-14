import { useCallback, useEffect, useState } from 'react'
import { toApiError, type ApiError } from '../api/axios'

// Loads data from the API and tracks the loading and error states.
// Wrap `request` in useCallback in the page, so it only changes when its inputs (filters, id) change:
//   const loadRooms = useCallback(() => getRooms({ search }), [search])
//   const { data, loading, error, refetch } = useApi(loadRooms)
function useApi<T>(request: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    // If the inputs change before this request finishes, its result is outdated and ignored.
    let ignore = false

    request()
      .then((result) => {
        if (!ignore) {
          setData(result)
          setError(null)
        }
      })
      .catch((requestError: unknown) => {
        if (!ignore) setError(toApiError(requestError))
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [request, reloadCount])

  // Runs the same request again, for example after a create, update or delete.
  const refetch = useCallback(() => {
    setLoading(true)
    setReloadCount((count) => count + 1)
  }, [])

  return { data, loading, error, refetch }
}

export default useApi
