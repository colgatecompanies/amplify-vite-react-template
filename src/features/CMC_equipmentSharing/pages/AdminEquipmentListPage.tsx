import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import { fetchUserAttributes } from 'aws-amplify/auth';
import type { Schema } from '../../../../amplify/data/resource';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { isAdmin } from '../../shared/utils/authUtils';
import '../../../App.css';

const client = generateClient<Schema>();

function AdminEquipmentListPage() {
  useAuthenticator((context) => [context.user]);
  const [machinery, setMachinery] = useState<Array<Schema['Machinery']['type']>>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [userIsAdmin, setUserIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    isAdmin().then((result) => {
      setUserIsAdmin(result);
    });
    fetchUserAttributes().then(attrs => {
      setEmail(attrs.email || '');
    });
  }, []);

  useEffect(() => {
    if (userIsAdmin !== null) {
      fetchMachinery();
    }
  }, [userIsAdmin]);

  async function fetchMachinery() {
    try {
      // Admin uses userPool to see ALL records (admin group rule)
      // apiKey only returns public reads and wouldn't include owner info
      const { data } = await client.models.Machinery.list({
        authMode: 'userPool',
      });
      data.sort((a, b) => a.name.localeCompare(b.name));
      setMachinery(data);
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

  async function handleStatusChange(id: string, newStatus: 'APPROVED' | 'REJECTED') {
    setUpdatingId(id);
    try {
      const { data, errors } = await client.models.Machinery.update(
        { id, listingStatus: newStatus },
        { authMode: 'userPool' }
      );
      if (errors?.length) {
        throw new Error(errors.map(e => e.message).join(', '));
      }
      if (data) {
        setMachinery(prev => prev.map(m => m.id === id ? { ...m, listingStatus: newStatus } : m));
      }
    } catch (error) {
      console.error('Error updating listing status:', error);
      alert('Error updating status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleBackfillZipCode() {
    const toUpdate = machinery.filter(m => !m.zipCode);
    if (toUpdate.length === 0) {
      alert('All listings already have a zip code.');
      return;
    }
    if (!confirm(`Set zip code 58046 on ${toUpdate.length} listing(s) that currently have none?`)) {
      return;
    }
    setMigrating(true);
    let updated = 0;
    for (const item of toUpdate) {
      try {
        await client.models.Machinery.update(
          { id: item.id, zipCode: '58046' },
          { authMode: 'userPool' }
        );
        updated++;
      } catch (e) {
        console.error('Failed to update', item.id, e);
      }
    }
    alert(`Updated ${updated} of ${toUpdate.length} listings with zip code 58046.`);
    setMigrating(false);
    fetchMachinery();
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
            <Link to="/"><img src="/images/home/DertWerk Logo Transparent.png" alt="DertWerk" style={{ maxWidth: '120px', marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} /></Link>
            <h1>Equipment Admin</h1>
            <p>Manage all equipment listings</p>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>Logged in as: {email}</p>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/admin/equipment/add" className="equipment-link">+ Add Equipment</Link>
          <Link to="/admin/reservations" className="equipment-link">Manage Reservations</Link>
        </div>

        {!loading && machinery.some(m => !m.zipCode) && (
          <div className="info-banner" style={{ marginBottom: '1.5rem' }}>
            <strong>{machinery.filter(m => !m.zipCode).length}</strong> listing(s) are missing a zip code.{' '}
            <button
              className="approve-button"
              onClick={handleBackfillZipCode}
              disabled={migrating}
              style={{ marginLeft: '0.75rem' }}
            >
              {migrating ? 'Updating...' : 'Set all to 58046'}
            </button>
          </div>
        )}

        {loading ? (
          <p>Loading equipment...</p>
        ) : machinery.length === 0 ? (
          <div className="no-equipment">
            <p>No equipment in the catalog yet. Use the button above to add your first item.</p>
          </div>
        ) : (
          <div className="admin-equipment-table-wrapper">
            <table className="admin-equipment-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Owner</th>
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
                    <td>{item.ownerEmail || '—'}</td>
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
                      {item.listingStatus !== 'APPROVED' && (
                        <button
                          className="approve-button"
                          onClick={() => handleStatusChange(item.id, 'APPROVED')}
                          disabled={updatingId === item.id}
                        >
                          Approve
                        </button>
                      )}
                      {item.listingStatus !== 'REJECTED' && (
                        <button
                          className="reject-button"
                          onClick={() => handleStatusChange(item.id, 'REJECTED')}
                          disabled={updatingId === item.id}
                        >
                          Reject
                        </button>
                      )}
                      <Link to={`/admin/equipment/edit/${item.id}`} className="edit-button">
                        Edit
                      </Link>
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(item.id, item.name)}
                        disabled={deletingId === item.id}
                      >
                        {deletingId === item.id ? '...' : 'Delete'}
                      </button>
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

export default AdminEquipmentListPage;
