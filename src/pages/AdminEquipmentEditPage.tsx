import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import { fetchUserAttributes } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { isAdmin } from '../utils/authUtils';
import { EQUIPMENT_CATEGORIES } from '../constants/categories';
import '../App.css';

const client = generateClient<Schema>();

function AdminEquipmentEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  useAuthenticator((context) => [context.user]);
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricePerDay: '',
    pricePerWeek: '',
    pricePerAcre: '',
    category: '',
    imageUrl: '',
    available: true,
  });

  const isAdminRoute = location.pathname.startsWith('/admin');
  const backPath = isAdminRoute ? '/admin' : '/dashboard';
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  useEffect(() => {
    fetchUserAttributes().then(attrs => {
      setEmail(attrs.email || '');
    });
    isAdmin().then(setUserIsAdmin);
  }, []);

  useEffect(() => {
    async function fetchMachinery() {
      if (!id) return;
      try {
        const { data } = await client.models.Machinery.get(
          { id },
          { authMode: 'userPool' }
        );
        if (!data) {
          setNotFound(true);
          return;
        }
        setFormData({
          name: data.name,
          description: data.description || '',
          pricePerDay: data.pricePerDay?.toString() || '',
          pricePerWeek: data.pricePerWeek?.toString() || '',
          pricePerAcre: data.pricePerAcre?.toString() || '',
          category: data.category || '',
          imageUrl: data.images?.[0] || '',
          available: data.available ?? true,
        });
      } catch (error) {
        console.error('Error fetching machinery:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchMachinery();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);

    try {
      const machineryData: any = {
        id,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        available: formData.available,
      };

      if (formData.pricePerDay) {
        machineryData.pricePerDay = parseFloat(formData.pricePerDay);
      }
      if (formData.pricePerWeek) {
        machineryData.pricePerWeek = parseFloat(formData.pricePerWeek);
      }
      if (formData.pricePerAcre) {
        machineryData.pricePerAcre = parseFloat(formData.pricePerAcre);
      }

      if (formData.imageUrl) {
        machineryData.images = [formData.imageUrl];
      }

      // Non-admin edits reset listing status so admin can re-approve
      if (!userIsAdmin) {
        machineryData.listingStatus = 'PENDING';
      }

      const { data, errors } = await client.models.Machinery.update(machineryData, {
        authMode: 'userPool',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors.map(e => e.message).join(', '));
      }

      if (!data) {
        throw new Error('No data returned from update operation');
      }

      alert('Equipment updated successfully!');
      navigate(backPath);
    } catch (error) {
      console.error('Error updating machinery:', error);
      alert('Error updating equipment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="page-container container">
        <div className="admin-content"><p>Loading equipment...</p></div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="page-container container">
        <div className="admin-content">
          <p>Equipment not found.</p>
          <Link to={backPath} className="back-link">Back to Equipment List</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container container">
      <div className="admin-content">
        <div className="admin-header">
          <div style={{ textAlign: 'center', width: '100%', marginBottom: '1rem' }}>
            <img src="/images/home/cmc-logo.png" alt="Colgate Machinery Company, LLC" style={{ maxWidth: '120px', marginBottom: '1rem' }} />
            <h1>Edit Equipment</h1>
            <p>Update equipment details</p>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>Logged in as: {email}</p>
          </div>
        </div>

        {!userIsAdmin && (
          <div className="info-banner">
            Edits to your listing will be sent for review before appearing on the public page.
          </div>
        )}

        <form onSubmit={handleSubmit} className="machinery-form">
          <div className="form-group">
            <label htmlFor="name">Equipment Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., John Deere 8R Tractor"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Enter equipment details, specifications, etc."
            />
          </div>

          <div className="form-row form-row-3">
            <div className="form-group">
              <label htmlFor="pricePerDay">Price per Day ($)</label>
              <input
                type="number"
                id="pricePerDay"
                name="pricePerDay"
                value={formData.pricePerDay}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="pricePerWeek">Price per Week ($)</label>
              <input
                type="number"
                id="pricePerWeek"
                name="pricePerWeek"
                value={formData.pricePerWeek}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="pricePerAcre">Price per Acre ($)</label>
              <input
                type="number"
                id="pricePerAcre"
                name="pricePerAcre"
                value={formData.pricePerAcre}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="">Select a category</option>
              {EQUIPMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="imageUrl">Image URL</label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
            <small>Enter a direct link to an image of the equipment</small>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="available"
                checked={formData.available}
                onChange={handleChange}
              />
              <span>Show listing (hidden if unchecked)</span>
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={submitting} className="submit-button">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <Link to={backPath} className="cancel-link">Cancel</Link>
          </div>
        </form>

        <Link to={backPath} className="back-link">← Back to Equipment List</Link>
      </div>
    </main>
  );
}

export default AdminEquipmentEditPage;
