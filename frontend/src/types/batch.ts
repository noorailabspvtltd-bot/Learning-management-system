export type BatchStatus = 'PLANNED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'

export const MAX_BATCH_STUDENTS = 500

export interface Batch {
  id: number
  name: string
  batch_code: string
  start_date: string
  end_date: string
  max_students: number
  status: BatchStatus
}

export interface CreateBatchPayload {
  name: string
  batch_code: string
  start_date: string
  end_date: string
  max_students: number
  status: BatchStatus
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
