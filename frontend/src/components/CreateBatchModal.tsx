import { useState, type FormEvent } from 'react'
import { Icon } from './Icon'
import { MAX_BATCH_STUDENTS, type CreateBatchPayload } from '../types/batch'
import { normalizeBatchDates } from '../utils/batchDates'

interface CreateBatchModalProps {
  onClose: () => void
  onSubmit: (payload: CreateBatchPayload) => Promise<void>
}

const initialForm: CreateBatchPayload = {
  name: '',
  batch_code: '',
  start_date: '',
  end_date: '',
  max_students: 30,
  status: 'PLANNED',
}

export function CreateBatchModal({ onClose, onSubmit }: CreateBatchModalProps) {
  const [form, setForm] = useState<CreateBatchPayload>(initialForm)
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
        aria-labelledby="create-batch-title"
      >
        <div className="modal-heading">
          <div>
            <span className="eyebrow">BATCH MANAGEMENT</span>
            <h2 id="create-batch-title">Create a new batch</h2>
            <p>Set up a learning group and invite students later.</p>
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

          {error && <p className="form-error form-field-wide" role="alert">{error}</p>}
          <div className="modal-footer form-field-wide">
            <button type="button" className="button button-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={submitting}>
              {submitting ? 'Creating…' : <><Icon name="plus" size={17} /> Create batch</>}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
