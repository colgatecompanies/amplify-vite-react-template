import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { fetchUserAttributes } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import AvailabilityCalendar from './AvailabilityCalendar';
import { datesOverlap, formatDisplayDate } from '../utils/dateUtils';

const client = generateClient<Schema>();

interface ReservationSlot {
  startDate: string;
  endDate: string;
  status: string | null;
}

interface ReservationFormProps {
  machineryId: string;
  machineryName: string;
  ownerEmail: string;
  reservations: ReservationSlot[];
  onReservationCreated: () => void;
}

function ReservationForm({
  machineryId,
  machineryName,
  ownerEmail,
  reservations,
  onReservationCreated,
}: ReservationFormProps) {
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleDateClick(date: string) {
    if (!selectedStart || selectedEnd) {
      // Start a new selection
      setSelectedStart(date);
      setSelectedEnd(null);
      setError('');
    } else {
      // Set end date
      if (date < selectedStart) {
        setSelectedEnd(selectedStart);
        setSelectedStart(date);
      } else {
        setSelectedEnd(date);
      }
    }
  }

  function clearSelection() {
    setSelectedStart(null);
    setSelectedEnd(null);
    setError('');
  }

  function validate(): boolean {
    if (!selectedStart) {
      setError('Please select at least one date.');
      return false;
    }

    const start = selectedStart;
    const end = selectedEnd || selectedStart;

    // Check overlap with APPROVED reservations
    for (const r of reservations) {
      if (r.status === 'APPROVED' && datesOverlap(start, end, r.startDate, r.endDate)) {
        setError('Selected dates overlap with a confirmed reservation. Please choose different dates.');
        return false;
      }
    }

    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError('');

    try {
      const attrs = await fetchUserAttributes();
      const requesterEmail = attrs.email || '';

      const start = selectedStart!;
      const end = selectedEnd || selectedStart!;

      const { errors } = await client.models.Reservation.create(
        {
          machineryId,
          machineryName,
          startDate: start,
          endDate: end,
          status: 'PENDING',
          requesterEmail,
          ownerEmail,
          notes: notes || undefined,
        },
        { authMode: 'userPool' }
      );

      if (errors && errors.length > 0) {
        throw new Error(errors.map((e) => e.message).join(', '));
      }

      alert('Reservation request submitted! The equipment owner will review your request.');
      setSelectedStart(null);
      setSelectedEnd(null);
      setNotes('');
      onReservationCreated();
    } catch (err) {
      console.error('Error creating reservation:', err);
      setError('Failed to submit reservation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const effectiveEnd = selectedEnd || selectedStart;

  return (
    <div className="reservation-form">
      <h3>Request a Reservation</h3>
      <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
        Click a date to select the start, then click another date for the end. Click a single date for a one-day reservation.
      </p>

      <AvailabilityCalendar
        reservations={reservations}
        selectedStart={selectedStart}
        selectedEnd={effectiveEnd}
        onDateClick={handleDateClick}
        interactive
      />

      {selectedStart && (
        <form onSubmit={handleSubmit}>
          <div className="reservation-date-display">
            <strong>Selected:</strong>{' '}
            {formatDisplayDate(selectedStart)}
            {effectiveEnd && effectiveEnd !== selectedStart && (
              <> &mdash; {formatDisplayDate(effectiveEnd)}</>
            )}
            <button type="button" onClick={clearSelection} className="cancel-link" style={{ marginLeft: '1rem' }}>
              Clear
            </button>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label htmlFor="reservation-notes">Notes (optional)</label>
            <textarea
              id="reservation-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any special requirements or questions..."
            />
          </div>

          {error && <p className="reservation-error">{error}</p>}

          <button type="submit" disabled={submitting} className="submit-button" style={{ marginTop: '0.5rem' }}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      )}

      {!selectedStart && error && <p className="reservation-error">{error}</p>}
    </div>
  );
}

export default ReservationForm;
