import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import { fetchUserAttributes } from 'aws-amplify/auth';
import type { Schema } from '../../../../amplify/data/resource';
import { useAuthenticator } from '@aws-amplify/ui-react';
import ReservationTable from '../components/ReservationTable';
import '../../../App.css';

const client = generateClient<Schema>();

function OwnerReservationsPage() {
  useAuthenticator((context) => [context.user]);
  const [reservations, setReservations] = useState<Array<Schema['Reservation']['type']>>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetchUserAttributes().then((attrs) => {
      setEmail(attrs.email || '');
    });
  }, []);

  useEffect(() => {
    if (email) fetchOwnerReservations();
  }, [email]);

  async function fetchOwnerReservations() {
    try {
      const { data } = await client.models.Reservation.list({
        authMode: 'userPool',
      });
      const forMyEquipment = data.filter((r) => r.ownerEmail === email);
      forMyEquipment.sort((a, b) => a.startDate.localeCompare(b.startDate));
      setReservations(forMyEquipment);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    setUpdatingId(id);
    try {
      const { errors } = await client.models.Reservation.update(
        { id, status: 'APPROVED' },
        { authMode: 'userPool' }
      );
      if (errors?.length) {
        throw new Error(errors.map((e) => e.message).join(', '));
      }
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'APPROVED' as const } : r))
      );
    } catch (error) {
      console.error('Error approving reservation:', error);
      alert('Error approving reservation. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleReject(id: string) {
    setUpdatingId(id);
    try {
      const { errors } = await client.models.Reservation.update(
        { id, status: 'REJECTED' },
        { authMode: 'userPool' }
      );
      if (errors?.length) {
        throw new Error(errors.map((e) => e.message).join(', '));
      }
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'REJECTED' as const } : r))
      );
    } catch (error) {
      console.error('Error rejecting reservation:', error);
      alert('Error rejecting reservation. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="page-container container">
      <div className="admin-equipment-content">
        <div className="admin-header">
          <div style={{ textAlign: 'center', width: '100%', marginBottom: '1rem' }}>
            <img src="/images/home/cmc-logo.png" alt="Colgate Machinery Company, LLC" style={{ maxWidth: '120px', marginBottom: '1rem' }} />
            <h1>Reservation Requests</h1>
            <p>Manage reservation requests for your equipment</p>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>Logged in as: {email}</p>
          </div>
        </div>

        {loading ? (
          <p>Loading reservations...</p>
        ) : (
          <ReservationTable
            reservations={reservations}
            showEquipmentName
            showRequester
            onApprove={handleApprove}
            onReject={handleReject}
            updatingId={updatingId}
          />
        )}

        <Link to="/dashboard" className="back-link" style={{ marginTop: '1.5rem', display: 'inline-block' }}>&larr; Back to Dashboard</Link>
      </div>
    </main>
  );
}

export default OwnerReservationsPage;
