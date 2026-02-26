import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../../../amplify/data/resource';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import ReservationForm from '../components/ReservationForm';
import { resolveImageUrl } from '../../shared/utils/storageUtils';
import '../../../App.css';

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
  const [imageUrls, setImageUrls] = useState<string[]>([]);

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

  useEffect(() => {
    if (!machinery) return;

    // Resolve S3 image keys to URLs
    const imgs = machinery.images?.filter((img): img is string => !!img) || [];
    if (imgs.length > 0) {
      Promise.all(imgs.map((key) => resolveImageUrl(key))).then(setImageUrls);
    } else {
      setImageUrls([]);
    }

    const prices: string[] = [];
    if (machinery.pricePerDay) prices.push(`$${Math.round(machinery.pricePerDay * 100) / 100}/day`);
    if (machinery.pricePerWeek) prices.push(`$${Math.round(machinery.pricePerWeek * 100) / 100}/week`);
    if (machinery.pricePerAcre) prices.push(`$${Math.round(machinery.pricePerAcre * 100) / 100}/ac`);
    const priceStr = prices.length > 0 ? ` - ${prices.join(', ')}` : '';
    const title = `${machinery.name}${priceStr} | Colgate Machinery Company`;
    const desc = machinery.description || `Rent ${machinery.name} from Colgate Machinery Company.`;
    document.title = title;
    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (el) {
        el.setAttribute('content', content);
      } else {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        el.setAttribute('content', content);
        document.head.appendChild(el);
      }
    };
    setMeta('og:title', title);
    setMeta('og:description', desc);
    setMeta('og:url', `https://colgatecompanies.com/equipment/${machinery.id}`);
    return () => {
      document.title = 'Colgate Machinery Company - Equipment Rental';
    };
  }, [machinery]);

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

        {imageUrls.length > 0 && (
          <div className="equipment-detail-images">
            {imageUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${machinery.name} - image ${i + 1}`}
                className="equipment-detail-image"
              />
            ))}
          </div>
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
            <span className="price">${Math.round(machinery.pricePerDay * 100) / 100}/day</span>
          )}
          {machinery.pricePerWeek != null && machinery.pricePerWeek > 0 && (
            <span className="price">${Math.round(machinery.pricePerWeek * 100) / 100}/week</span>
          )}
          {machinery.pricePerAcre != null && machinery.pricePerAcre > 0 && (
            <span className="price">${Math.round(machinery.pricePerAcre * 100) / 100}/ac</span>
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
