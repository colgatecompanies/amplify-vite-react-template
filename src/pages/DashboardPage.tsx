import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import { fetchUserAttributes } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { resolveImageUrl, downloadImage } from '../utils/storageUtils';
import '../App.css';

const client = generateClient<Schema>();

function DashboardPage() {
  const { user } = useAuthenticator((context) => [context.user]);
  const [machinery, setMachinery] = useState<Array<Schema['Machinery']['type']>>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetchUserAttributes().then(attrs => {
      setEmail(attrs.email || '');
    });
  }, []);

  useEffect(() => {
    if (email) {
      fetchMyMachinery();
    }
  }, [email]);

  async function fetchMyMachinery() {
    try {
      const { data } = await client.models.Machinery.list({
        authMode: 'userPool',
      });
      // Filter to only show equipment owned by the current user.
      // Check ownerEmail (explicitly set) and the Amplify owner field
      // (auto-set by allow.owner() rule). The owner field may be stored
      // as "sub" or "sub::username", so check for both formats.
      const userId = user?.userId || '';
      const myItems = data.filter(item => {
        const ownerField = (item as any).owner || '';
        return (
          item.ownerEmail === email ||
          ownerField === userId ||
          ownerField.startsWith(`${userId}::`)
        );
      });
      myItems.sort((a, b) => a.name.localeCompare(b.name));
      setMachinery(myItems);
    } catch (error) {
      console.error('Error fetching machinery:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const { errors } = await client.models.Machinery.delete(
        { id },
        { authMode: 'userPool' }
      );
      if (errors?.length) {
        throw new Error(errors.map(e => e.message).join(', '));
      }
      setMachinery(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting machinery:', error);
      alert('Error deleting equipment. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  function statusLabel(status: string | null | undefined) {
    switch (status) {
      case 'APPROVED': return 'Approved';
      case 'REJECTED': return 'Rejected';
      case 'PENDING':
      default: return 'Pending Review';
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

  return (
    <main className="page-container container">
      <div className="admin-equipment-content">
        <div className="admin-header">
          <div style={{ textAlign: 'center', width: '100%', marginBottom: '1rem' }}>
            <img src="/images/home/cmc-logo.png" alt="Colgate Machinery Company, LLC" style={{ maxWidth: '120px', marginBottom: '1rem' }} />
            <h1>My Equipment</h1>
            <p>Manage your equipment listings</p>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>Logged in as: {email}</p>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/dashboard/equipment/add" className="equipment-link">+ Add Equipment</Link>
          <Link to="/dashboard/reservations" className="equipment-link">My Reservations</Link>
          <Link to="/dashboard/reservations/manage" className="equipment-link">Manage Requests</Link>
        </div>

        {loading ? (
          <p>Loading your equipment...</p>
        ) : machinery.length === 0 ? (
          <div className="no-equipment">
            <p>You haven't listed any equipment yet. Use the button above to add your first item.</p>
          </div>
        ) : (
          <div className="admin-equipment-table-wrapper">
            <table className="admin-equipment-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Daily Rate</th>
                  <th>Weekly Rate</th>
                  <th>Acre Rate</th>
                  <th>Listing Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {machinery.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      {item.description && (
                        <div className="equipment-description-preview">
                          {item.description.length > 80
                            ? item.description.substring(0, 80) + '...'
                            : item.description}
                        </div>
                      )}
                    </td>
                    <td>{item.category || '—'}</td>
                    <td>{item.pricePerDay ? `$${Math.round(item.pricePerDay * 100) / 100}` : '—'}</td>
                    <td>{item.pricePerWeek ? `$${Math.round(item.pricePerWeek * 100) / 100}` : '—'}</td>
                    <td>{item.pricePerAcre ? `$${Math.round(item.pricePerAcre * 100) / 100}/ac` : '—'}</td>
                    <td>
                      <span className={statusClass(item.listingStatus)}>
                        {statusLabel(item.listingStatus)}
                      </span>
                    </td>
                    <td className="action-buttons">
                      <Link to={`/dashboard/equipment/edit/${item.id}`} className="edit-button">
                        Edit
                      </Link>
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(item.id, item.name)}
                        disabled={deletingId === item.id}
                      >
                        {deletingId === item.id ? '...' : 'Delete'}
                      </button>
                      {item.images && item.images.filter(Boolean).length > 0 && (
                        <button
                          className="image-download-btn"
                          onClick={async () => {
                            const imgs = item.images!.filter((img): img is string => !!img);
                            for (const key of imgs) {
                              const url = await resolveImageUrl(key);
                              const parts = key.split('/');
                              const filename = parts[parts.length - 1] || 'equipment-image.jpg';
                              await downloadImage(url, filename);
                            }
                          }}
                        >
                          Download Images
                        </button>
                      )}
                      {item.listingStatus === 'APPROVED' && (
                        <button
                          className="share-facebook-button"
                          onClick={async () => {
                            const url = `https://colgatecompanies.com/equipment/${item.id}`;
                            const prices: string[] = [];
                            if (item.pricePerDay) prices.push(`$${Math.round(item.pricePerDay * 100) / 100}/day`);
                            if (item.pricePerWeek) prices.push(`$${Math.round(item.pricePerWeek * 100) / 100}/week`);
                            if (item.pricePerAcre) prices.push(`$${Math.round(item.pricePerAcre * 100) / 100}/ac`);
                            const priceStr = prices.length > 0 ? ` (${prices.join(', ')})` : '';
                            const text = `${item.name}${priceStr}\n\n${item.description || ''}\n\nView details & check availability:\n${url}`;
                            try {
                              await navigator.clipboard.writeText(text);
                              alert('Listing details copied to clipboard! Facebook Marketplace will open — paste the details into your listing description.');
                            } catch {
                              prompt('Copy this text for your Marketplace listing:', text);
                            }
                            window.open('https://www.facebook.com/marketplace/create/item/', '_blank');
                          }}
                        >
                          Share
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Link to="/equipment" className="back-link" style={{ marginTop: '1.5rem', display: 'inline-block' }}>← View Public Page</Link>
      </div>
    </main>
  );
}

export default DashboardPage;
