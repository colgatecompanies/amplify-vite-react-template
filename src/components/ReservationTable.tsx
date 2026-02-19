import { formatDisplayDate } from '../utils/dateUtils';

interface Reservation {
  id: string;
  machineryName: string;
  requesterEmail: string;
  startDate: string;
  endDate: string;
  status?: string | null | undefined;
  notes?: string | null;
}

interface ReservationTableProps {
  reservations: Reservation[];
  showEquipmentName?: boolean;
  showRequester?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
  updatingId?: string | null;
}

function statusLabel(status: string | null | undefined) {
  switch (status) {
    case 'APPROVED': return 'Approved';
    case 'REJECTED': return 'Rejected';
    case 'PENDING':
    default: return 'Pending';
  }
}

function statusClass(status: string | null | undefined) {
  switch (status) {
    case 'APPROVED': return 'status-approved';
    case 'REJECTED': return 'status-rejected';
    case 'PENDING':
    default: return 'status-pending';
  }
}

function ReservationTable({
  reservations,
  showEquipmentName = true,
  showRequester = true,
  onApprove,
  onReject,
  onCancel,
  onDelete,
  updatingId,
}: ReservationTableProps) {
  if (reservations.length === 0) {
    return <p>No reservations found.</p>;
  }

  const hasActions = onApprove || onReject || onCancel || onDelete;

  return (
    <div className="admin-equipment-table-wrapper">
      <table className="admin-equipment-table">
        <thead>
          <tr>
            {showEquipmentName && <th>Equipment</th>}
            {showRequester && <th>Requester</th>}
            <th>Start Date</th>
            <th>End Date</th>
            <th>Status</th>
            {hasActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {reservations.map((r) => (
            <tr key={r.id}>
              {showEquipmentName && <td><strong>{r.machineryName}</strong></td>}
              {showRequester && <td>{r.requesterEmail}</td>}
              <td>{formatDisplayDate(r.startDate)}</td>
              <td>{formatDisplayDate(r.endDate)}</td>
              <td>
                <span className={statusClass(r.status)}>
                  {statusLabel(r.status)}
                </span>
              </td>
              {hasActions && (
                <td className="action-buttons">
                  {onApprove && r.status !== 'APPROVED' && (
                    <button
                      className="approve-button"
                      onClick={() => onApprove(r.id)}
                      disabled={updatingId === r.id}
                    >
                      Approve
                    </button>
                  )}
                  {onReject && r.status !== 'REJECTED' && (
                    <button
                      className="reject-button"
                      onClick={() => onReject(r.id)}
                      disabled={updatingId === r.id}
                    >
                      Reject
                    </button>
                  )}
                  {onCancel && (
                    <button
                      className="delete-button"
                      onClick={() => onCancel(r.id)}
                      disabled={updatingId === r.id}
                    >
                      Cancel
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className="delete-button"
                      onClick={() => onDelete(r.id)}
                      disabled={updatingId === r.id}
                    >
                      Delete
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ReservationTable;
