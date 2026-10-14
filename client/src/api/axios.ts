import axios from 'axios'

// The ONE axios instance. Every request function in src/api/ must use it.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

export type ApiError = {
  message: string
  status: number | null // HTTP status code, or null if the server could not be reached
}

// Turns any error from a request into { message, status }.
// The message is the server's { message } whenever the server sent one.
export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (!error.response) {
      return { message: 'Cannot reach the server. Check that the API is running.', status: null }
    }
    const message = error.response.data?.message ?? `Request failed with status ${error.response.status}`
    return { message, status: error.response.status }
  }
  return { message: 'Something went wrong. Please try again.', status: null }
}

export default api
