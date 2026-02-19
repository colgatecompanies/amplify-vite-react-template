import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import ReservationForm from '../components/ReservationForm';
import '../App.css';

const client = generateClient<Schema>();

function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [machinery, setMachinery] = useState<Schema['Machinery']['type'] | null>(null);
  const [reservations, setReservations] = useState<Array<{
    startDate: string;
    endDate: string;
    status: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false));
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchEquipment();
    fetchReservations();
  }, [id]);

  async function fetchEquipment() {
    try {
      const { data } = await client.models.Machinery.get(
        { id: id! },
        { authMode: 'apiKey' }
      );
      if (!data) {
        setNotFound(true);
        return;
      }
      setMachinery(data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReservations() {
    try {
      const { data } = await client.models.Reservation.list({
        authMode: 'apiKey',
      });
      const filtered = data.filter(
        (r) => r.machineryId === id && r.status !== 'REJECTED'
      );
      setReservations(
        filtered.map((r) => ({
          startDate: r.startDate,
          endDate: r.endDate,
          status: r.status ?? null,
        }))
      );
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  }

  if (loading) {
    return (
      <main className="page-container container">
        <div className="equipment-detail-content"><p>Loading equipment...</p></div>
      </main>
    );
  }

  if (notFound || !machinery) {
    return (
      <main className="page-container container">
        <div className="equipment-detail-content">
          <p>Equipment not found.</p>
          <Link to="/equipment" className="back-link">&larr; Back to Equipment</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container container">
      <div className="equipment-detail-content">
        <Link to="/equipment" className="back-link">&larr; Back to Equipment</Link>

        {machinery.images && machinery.images.length > 0 && (
          <img
            src={machinery.images[0]}
            alt={machinery.name}
            className="equipment-detail-image"
          />
        )}

        <h1>{machinery.name}</h1>

        {machinery.category && (
          <span className="machinery-category">{machinery.category}</span>
        )}

        {machinery.description && (
          <p style={{ marginTop: '1rem', color: '#555', lineHeight: '1.6' }}>
            {machinery.description}
          </p>
        )}

        <div className="equipment-detail-pricing">
          {machinery.pricePerDay != null && machinery.pricePerDay > 0 && (
            <span className="price">${machinery.pricePerDay}/day</span>
          )}
          {machinery.pricePerWeek != null && machinery.pricePerWeek > 0 && (
            <span className="price">${machinery.pricePerWeek}/week</span>
          )}
          {machinery.pricePerAcre != null && machinery.pricePerAcre > 0 && (
            <span className="price">${machinery.pricePerAcre}/ac</span>
          )}
        </div>

        <div className="equipment-detail-section">
          <h2>Availability</h2>
          <AvailabilityCalendar reservations={reservations} />
        </div>

        <div className="equipment-detail-section">
          {isAuthenticated ? (
            <ReservationForm
              machineryId={machinery.id}
              machineryName={machinery.name}
              ownerEmail={machinery.ownerEmail || ''}
              reservations={reservations}
              onReservationCreated={fetchReservations}
            />
          ) : (
            <div className="sign-in-prompt">
              <p>Sign in to request a reservation for this equipment.</p>
              <Link to="/dashboard" className="equipment-link">Sign In / Create Account</Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default EquipmentDetailPage;
