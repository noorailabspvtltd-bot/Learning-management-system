import { useCallback, useEffect, useState } from 'react'
import { BatchTable } from '../components/BatchTable'
import { CreateBatchModal } from '../components/CreateBatchModal'
import { Icon } from '../components/Icon'
import { createBatch, deleteBatch, getApiErrorMessage, getBatches, updateBatch, updateBatchStatus } from '../services/batches'
import type { Batch, BatchStatus, CreateBatchPayload } from '../types/batch'

export function MyBatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [batchToEdit, setBatchToEdit] = useState<Batch | null>(null)
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [notice, setNotice] = useState('')
  const [statusError, setStatusError] = useState('')
  const [isStatusUpdating, setIsStatusUpdating] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    getBatches(controller.signal)
      .then((loadedBatches) => {
        if (!controller.signal.aborted) setBatches(loadedBatches)
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setLoadError(getApiErrorMessage(error))
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [])

  const loadBatches = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      setBatches(await getBatches())
    } catch (error) {
      setLoadError(getApiErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  async function handleCreate(payload: CreateBatchPayload) {
    try {
      const created = await createBatch(payload)
      setBatches((current) => [created, ...current])
      setModalOpen(false)
      setNotice('Batch created successfully.')
      window.setTimeout(() => setNotice(''), 3500)
    } catch (error) {
      throw new Error(getApiErrorMessage(error), { cause: error })
    }
  }

  async function handleUpdate(payload: CreateBatchPayload) {
    if (!batchToEdit) return
    try {
      const updated = await updateBatch(batchToEdit.id, payload)
      setBatches((current) => current.map((batch) => batch.id === updated.id ? updated : batch))
      setBatchToEdit(null)
      setNotice('Batch updated successfully.')
      window.setTimeout(() => setNotice(''), 3500)
    } catch (error) {
      throw new Error(getApiErrorMessage(error), { cause: error })
    }
  }

  async function handleDelete() {
    if (!batchToDelete) return
    setDeleteSubmitting(true)
    setDeleteError('')
    try {
      await deleteBatch(batchToDelete.id)
      setBatches((current) => current.filter((batch) => batch.id !== batchToDelete.id))
      setBatchToDelete(null)
      setNotice('Batch deleted successfully.')
      window.setTimeout(() => setNotice(''), 3500)
    } catch (error) {
      setDeleteError(getApiErrorMessage(error))
    } finally {
      setDeleteSubmitting(false)
    }
  }

  async function handleStatusChange(batch: Batch, status: BatchStatus) {
    setStatusError('')
    setIsStatusUpdating(true)
    try {
      const updated = await updateBatchStatus(batch.id, status)
      setBatches((current) => current.map((item) => item.id === updated.id ? updated : item))
    } catch (error) {
      setStatusError(getApiErrorMessage(error))
    } finally {
      setIsStatusUpdating(false)
    }
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-dot" /> YOUR LEARNING SPACE</div>
          <h1>My Batches</h1>
          <p>View, create, and delete learning batches.</p>
        </div>
        <button type="button" className="button button-primary create-button" onClick={() => setModalOpen(true)}>
          <Icon name="plus" size={18} /> Create batch
        </button>
      </section>

      <section className="batches-section">
        <div className="section-heading">
          <div>
            <h2>All batches <span className="section-count">{batches.length}</span></h2>
            <p>Your batches from the learning platform.</p>
          </div>
        </div>
        {statusError && <p className="form-error status-update-error" role="alert">{statusError}</p>}

        {loadError ? (
          <div className="load-error" role="alert">
            <div><strong>We couldn’t load your batches</strong><p>{loadError}</p></div>
            <button type="button" className="button button-secondary" onClick={() => void loadBatches()}>Try again</button>
          </div>
        ) : isLoading ? (
          <div className="loading-card"><span className="loading-spinner" /> Loading batches…</div>
        ) : (
          <BatchTable
            batches={batches}
            onEdit={setBatchToEdit}
            onDelete={(batch) => { setDeleteError(''); setBatchToDelete(batch) }}
            onStatusChange={handleStatusChange}
            isStatusUpdating={isStatusUpdating}
          />
        )}
      </section>

      <footer className="page-footer"><span>© 2025 Noor AI Labs</span><span>Made for better learning <span className="footer-heart">♥</span></span></footer>

      {notice && <div className="toast" role="status"><Icon name="check" size={17} />{notice}</div>}
      {modalOpen && <CreateBatchModal onClose={() => setModalOpen(false)} onSubmit={handleCreate} />}
      {batchToEdit && (
        <CreateBatchModal
          key={batchToEdit.id}
          batch={batchToEdit}
          onClose={() => setBatchToEdit(null)}
          onSubmit={handleUpdate}
        />
      )}
      {batchToDelete && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !deleteSubmitting) setBatchToDelete(null)
        }}>
          <section className="confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="delete-batch-title">
            <span className="summary-icon summary-icon-amber"><Icon name="check" size={20} /></span>
            <h2 id="delete-batch-title">Delete this batch?</h2>
            <p><strong>{batchToDelete.name}</strong> ({batchToDelete.batch_code}) will be permanently deleted.</p>
            <p className="confirm-warning">This action cannot be undone. Ongoing batches must be cancelled or completed first.</p>
            {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
            <div className="modal-footer">
              <button type="button" className="button button-secondary" disabled={deleteSubmitting} onClick={() => setBatchToDelete(null)}>Keep batch</button>
              <button type="button" className="button button-danger" disabled={deleteSubmitting} onClick={() => void handleDelete()}>
                {deleteSubmitting ? 'Deleting…' : 'Delete batch'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
