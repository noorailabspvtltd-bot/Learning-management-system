import { Icon } from './Icon'
import type { Batch, BatchStatus } from '../types/batch'

interface BatchTableProps {
  batches: Batch[]
  onDelete: (batch: Batch) => void
}

const statusLabels: Record<BatchStatus, string> = {
  PLANNED: 'Planned',
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

function formatDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`)
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed)
}

export function BatchTable({ batches, onDelete }: BatchTableProps) {
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
                <td><span className={`status-badge status-${batch.status.toLowerCase()}`}><span />{statusLabels[batch.status]}</span></td>
                <td className="actions-cell">
                  <button type="button" className="button button-danger" onClick={() => onDelete(batch)}>
                    Delete
                  </button>
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
