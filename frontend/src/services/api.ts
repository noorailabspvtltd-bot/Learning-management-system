import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  headers: {
    'Content-Type': 'application/json',
  },
})

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data
    if (data && typeof data === 'object' && 'detail' in data && typeof data.detail === 'string') {
      return data.detail
    }
    if (error.response?.status === 400 && data && typeof data === 'object') {
      return Object.entries(data)
        .map(([field, messages]) => {
          const value = Array.isArray(messages) ? messages.join(', ') : String(messages)
          return `${field}: ${value}`
        })
        .join(' ')
    }
    if (error.response?.status === 401) return 'Your session has expired. Please sign in again.'
    if (error.response?.status === 403) return 'You do not have permission to perform this action.'
    if (error.response?.status === 404) return 'The requested API resource was not found.'
    if (error.response && error.response.status >= 500) return 'The server is unavailable right now. Please try again later.'
    if (!error.response) return 'Unable to reach the server. Check your connection and try again.'
  }

  return 'Something went wrong while communicating with the server.'
}

export default api
