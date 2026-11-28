import { Icon } from './Icon'
import type { Batch, BatchStatus } from '../types/batch'

interface BatchTableProps {
  batches: Batch[]
  onEdit: (batch: Batch) => void
  onDelete: (batch: Batch) => void
  onStatusChange: (batch: Batch, status: BatchStatus) => Promise<void>
  isStatusUpdating: boolean
}

const statusLabels: Record<BatchStatus, string> = {
  PLANNED: 'Planned',
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const allowedStatusTransitions: Partial<Record<BatchStatus, readonly BatchStatus[]>> = {
  PLANNED: ['ONGOING', 'CANCELLED'],
  ONGOING: ['COMPLETED', 'CANCELLED'],
}

function formatDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`)
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed)
}

export function BatchTable({ batches, onEdit, onDelete, onStatusChange, isStatusUpdating }: BatchTableProps) {
  return (
    <div className="table-card">
      <div className="table-scroll">
        <table className="batch-table">
          <thead>
            <tr>
              <th>Batch name</th>
              <th>Duration</th>
              <th>Capacity</th>
              <th>Status</th>
              <th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id}>
                <td>
                  <div className="batch-name-button">
                    <span className="batch-avatar">{batch.name.trim().charAt(0).toUpperCase() || 'B'}</span>
                    <span className="batch-name-copy">
                      <strong>{batch.name}</strong>
                      <small>{batch.batch_code}</small>
                    </span>
                  </div>
                </td>
                <td>
                  <span className="date-range">{formatDate(batch.start_date)} – {formatDate(batch.end_date)}</span>
                  <span className="date-caption"><Icon name="calendar" size={13} /> Batch period</span>
                </td>
                <td><span className="capacity-value">{batch.max_students}</span><span className="capacity-caption">students max</span></td>
                <td>
                  {allowedStatusTransitions[batch.status] ? (
                    <select
                      className={`status-transition-select status-${batch.status.toLowerCase()}`}
                      aria-label={`Change status for ${batch.name}`}
                      value={batch.status}
                      disabled={isStatusUpdating}
                      onChange={(event) => {
                        const nextStatus = allowedStatusTransitions[batch.status]?.find(
                          (candidate) => candidate === event.currentTarget.value,
                        )
                        if (nextStatus) void onStatusChange(batch, nextStatus)
                      }}
                    >
                      <option value={batch.status}>{statusLabels[batch.status]}</option>
                      {allowedStatusTransitions[batch.status]?.map((nextStatus) => (
                        <option key={nextStatus} value={nextStatus}>{statusLabels[nextStatus]}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`status-badge status-${batch.status.toLowerCase()}`}>
                      <span />{statusLabels[batch.status]}
                    </span>
                  )}
                </td>
                <td className="actions-cell">
                  <div className="batch-row-actions">
                    <button
                      type="button"
                      className="button button-secondary"
                      aria-label={`Edit ${batch.name}`}
                      onClick={() => onEdit(batch)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="button button-danger"
                      aria-label={`Delete ${batch.name}`}
                      onClick={() => onDelete(batch)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {batches.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="empty-table">
                    <span className="empty-icon"><Icon name="layers" size={22} /></span>
                    <strong>No batches yet</strong>
                    <p>Create a batch to see it listed here.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
