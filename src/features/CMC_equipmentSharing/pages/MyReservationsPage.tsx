import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import { fetchUserAttributes } from 'aws-amplify/auth';
import type { Schema } from '../../../../amplify/data/resource';
import { useAuthenticator } from '@aws-amplify/ui-react';
import ReservationTable from '../components/ReservationTable';
import '../../../App.css';

const client = generateClient<Schema>();

function MyReservationsPage() {
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
    if (email) fetchMyReservations();
  }, [email]);

  async function fetchMyReservations() {
    try {
      const { data } = await client.models.Reservation.list({
        authMode: 'userPool',
      });
      const mine = data.filter((r) => r.requesterEmail === email);
      mine.sort((a, b) => a.startDate.localeCompare(b.startDate));
      setReservations(mine);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm('Are you sure you want to cancel this reservation request?')) return;
    setUpdatingId(id);
    try {
      const { errors } = await client.models.Reservation.delete(
        { id },
        { authMode: 'userPool' }
      );
      if (errors?.length) {
        throw new Error(errors.map((e) => e.message).join(', '));
      }
      setReservations((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      alert('Error cancelling reservation. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="page-container container">
      <div className="admin-equipment-content">
        <div className="admin-header">
          <div style={{ textAlign: 'center', width: '100%', marginBottom: '1rem' }}>
            <Link to="/"><img src="/images/home/DertWerk Logo.png" alt="DertWerk" style={{ maxWidth: '120px', marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} /></Link>
            <h1>My Reservations</h1>
            <p>Track your equipment reservation requests</p>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>Logged in as: {email}</p>
          </div>
        </div>

        {loading ? (
          <p>Loading reservations...</p>
        ) : (
          <ReservationTable
            reservations={reservations}
            showEquipmentName
            showRequester={false}
            onCancel={handleCancel}
            updatingId={updatingId}
          />
        )}

        <Link to="/dashboard" className="back-link" style={{ marginTop: '1.5rem', display: 'inline-block' }}>&larr; Back to Dashboard</Link>
      </div>
    </main>
  );
}

export default MyReservationsPage;
