import { useState, type FormEvent } from 'react'
import { Icon } from './Icon'
import { MAX_BATCH_STUDENTS, type Batch, type BatchStatus, type CreateBatchPayload } from '../types/batch'
import { normalizeBatchDates } from '../utils/batchDates'

const createStatusOptions: { value: BatchStatus; label: string }[] = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'ONGOING', label: 'Ongoing' },
]

const statusLabels: Record<BatchStatus, string> = {
  PLANNED: 'Planned',
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

interface CreateBatchModalProps {
  onClose: () => void
  onSubmit: (payload: CreateBatchPayload) => Promise<void>
  batch?: Batch
}

const initialForm: CreateBatchPayload = {
  name: '',
  batch_code: '',
  start_date: '',
  end_date: '',
  max_students: 30,
  status: 'PLANNED',
}

export function CreateBatchModal({ onClose, onSubmit, batch }: CreateBatchModalProps) {
  const isEditing = Boolean(batch)
  const [form, setForm] = useState<CreateBatchPayload>(() => batch ? {
    name: batch.name,
    batch_code: batch.batch_code,
    start_date: batch.start_date,
    end_date: batch.end_date,
    max_students: batch.max_students,
    status: batch.status,
  } : initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const dates = normalizeBatchDates(form.start_date, form.end_date)
    if (!dates) {
      setError('Enter valid dates in YYYY-MM-DD format, with the end date on or after the start date.')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({ ...form, ...dates })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create the batch.')
    } finally {
      setSubmitting(false)
    }
  }

  function update<K extends keyof CreateBatchPayload>(key: K, value: CreateBatchPayload[K]) {
    setError('')
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !submitting) onClose()
    }}>
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="batch-form-title"
      >
        <div className="modal-heading">
          <div>
            <span className="eyebrow">BATCH MANAGEMENT</span>
            <h2 id="batch-form-title">{isEditing ? 'Edit batch' : 'Create a new batch'}</h2>
            <p>{isEditing ? 'Update the batch details. Change its status from the batch list.' : 'Set up a learning group and invite students later.'}</p>
          </div>
          <button type="button" className="icon-button modal-close" onClick={onClose} aria-label="Close modal" disabled={submitting}>
            <Icon name="close" size={19} />
          </button>
        </div>

        <form className="batch-form" onSubmit={handleSubmit}>
          <label className="form-field form-field-wide">
            <span>Batch name <em>*</em></span>
            <input
              required
              maxLength={100}
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder="e.g. AI Foundations — Spring"
            />
          </label>
          <label className="form-field">
            <span>Batch code <em>*</em></span>
            <input
              required
              maxLength={30}
              value={form.batch_code}
              onChange={(event) => update('batch_code', event.target.value)}
              placeholder="e.g. AIF-2025-01"
            />
          </label>
          <label className="form-field">
            <span>Maximum students (1 to {MAX_BATCH_STUDENTS}) <em>*</em></span>
            <input
              required
              type="number"
              min={1}
              max={MAX_BATCH_STUDENTS}
              value={form.max_students}
              onChange={(event) => update('max_students', Number(event.target.value))}
            />
          </label>
          <label className="form-field">
            <span>Start date <em>*</em></span>
            <input
              required
              type="text"
              maxLength={10}
              pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
              value={form.start_date}
              onChange={(event) => update('start_date', event.currentTarget.value)}
              placeholder="YYYY-MM-DD"
            />
          </label>
          <label className="form-field">
            <span>End date <em>*</em></span>
            <input
              required
              type="text"
              maxLength={10}
              pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
              value={form.end_date}
              onChange={(event) => update('end_date', event.currentTarget.value)}
              placeholder="YYYY-MM-DD"
            />
          </label>
          <label className="form-field form-field-wide">
            <span>Status</span>
            <select
              value={form.status}
              disabled={isEditing}
              onChange={(event) => {
                const selectedStatus = createStatusOptions.find(
                  (option) => option.value === event.currentTarget.value,
                )
                if (selectedStatus) update('status', selectedStatus.value)
              }}
            >
              {isEditing
                ? <option value={form.status}>{statusLabels[form.status]}</option>
                : createStatusOptions.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
            </select>
          </label>

          {error && <p className="form-error form-field-wide" role="alert">{error}</p>}
          <div className="modal-footer form-field-wide">
            <button type="button" className="button button-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={submitting}>
              {submitting
                ? isEditing ? 'Saving…' : 'Creating…'
                : isEditing ? 'Save changes' : <><Icon name="plus" size={17} /> Create batch</>}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
