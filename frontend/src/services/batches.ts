import type { AxiosResponse } from 'axios'
import api from './api'
import type { Batch, CreateBatchPayload, PaginatedResponse } from '../types/batch'
export { getApiErrorMessage } from './api'

export async function getBatches(signal?: AbortSignal): Promise<Batch[]> {
  const batches: Batch[] = []
  let nextPage: string | null = '/batches/'

  while (nextPage) {
    const response: AxiosResponse<PaginatedResponse<Batch> | Batch[]> =
      await api.get<PaginatedResponse<Batch> | Batch[]>(nextPage, { signal })
    if (Array.isArray(response.data)) {
      batches.push(...response.data)
      break
    }

    batches.push(...response.data.results)
    if (response.data.next) {
      const nextUrl = new URL(response.data.next, window.location.origin)
      const apiBasePath = api.defaults.baseURL
        ? new URL(api.defaults.baseURL, window.location.origin).pathname.replace(/\/$/, '')
        : ''
      const isApiPath = apiBasePath && (
        nextUrl.pathname === apiBasePath || nextUrl.pathname.startsWith(`${apiBasePath}/`)
      )
      const endpointPath = isApiPath ? nextUrl.pathname.slice(apiBasePath.length) || '/' : nextUrl.pathname
      nextPage = `${endpointPath}${nextUrl.search}`
    } else {
      nextPage = null
    }
  }

  return batches
}

export async function createBatch(payload: CreateBatchPayload): Promise<Batch> {
  const response = await api.post<Batch>('/batches/', payload)
  return response.data
}

export async function deleteBatch(id: number): Promise<void> {
  await api.delete(`/batches/${id}/`)
}
