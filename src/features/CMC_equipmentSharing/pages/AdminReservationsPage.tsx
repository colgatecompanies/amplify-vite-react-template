import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import { fetchUserAttributes } from 'aws-amplify/auth';
import type { Schema } from '../../../../amplify/data/resource';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { isAdmin } from '../../shared/utils/authUtils';
import ReservationTable from '../components/ReservationTable';
import '../../../App.css';

const client = generateClient<Schema>();

function AdminReservationsPage() {
  useAuthenticator((context) => [context.user]);
  const [reservations, setReservations] = useState<Array<Schema['Reservation']['type']>>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [userIsAdmin, setUserIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    isAdmin().then(setUserIsAdmin);
    fetchUserAttributes().then((attrs) => {
      setEmail(attrs.email || '');
    });
  }, []);

  useEffect(() => {
    if (userIsAdmin) fetchAllReservations();
  }, [userIsAdmin]);

  async function fetchAllReservations() {
    try {
      const { data } = await client.models.Reservation.list({
        authMode: 'userPool',
      });
      data.sort((a, b) => a.startDate.localeCompare(b.startDate));
      setReservations(data);
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

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this reservation?')) return;
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
      console.error('Error deleting reservation:', error);
      alert('Error deleting reservation. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  }

  if (userIsAdmin === null) {
    return (
      <main className="page-container container">
        <div className="admin-equipment-content"><p>Loading...</p></div>
      </main>
    );
  }

  if (!userIsAdmin) {
    return (
      <main className="page-container container">
        <div className="admin-equipment-content">
          <h1>Access Denied</h1>
          <p>You do not have permission to access the admin panel.</p>
          <Link to="/dashboard" className="back-link">Go to My Dashboard</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container container">
      <div className="admin-equipment-content">
        <div className="admin-header">
          <div style={{ textAlign: 'center', width: '100%', marginBottom: '1rem' }}>
            <img src="/images/home/cmc-logo.png" alt="Colgate Machinery Company, LLC" style={{ maxWidth: '120px', marginBottom: '1rem' }} />
            <h1>All Reservations</h1>
            <p>Manage all equipment reservations</p>
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
            onDelete={handleDelete}
            updatingId={updatingId}
          />
        )}

        <Link to="/admin" className="back-link" style={{ marginTop: '1.5rem', display: 'inline-block' }}>&larr; Back to Equipment Admin</Link>
      </div>
    </main>
  );
}

export default AdminReservationsPage;
