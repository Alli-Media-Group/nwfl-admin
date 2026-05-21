import { useCallback, useState } from 'react'

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async <T,>(task: () => Promise<T>) => {
    setLoading(true)
    setError(null)

    try {
      return await task()
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Something went wrong.'
      setError(message)
      throw caught
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    error,
    execute,
    loading,
    setError,
  }
}
