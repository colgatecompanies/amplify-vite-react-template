import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import { fetchUserAttributes } from 'aws-amplify/auth';
import type { Schema } from '../../../../amplify/data/resource';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { isAdmin } from '../../shared/utils/authUtils';
import { EQUIPMENT_CATEGORIES } from '../constants/categories';
import ImageUploader from '../components/ImageUploader';
import '../../../App.css';

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
    available: true,
    zipCode: '',
  });
  const [images, setImages] = useState<string[]>([]);

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
          available: data.available ?? true,
          zipCode: data.zipCode || '',
        });
        setImages(data.images?.filter((img): img is string => !!img) || []);
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
        zipCode: formData.zipCode,
      };

      if (formData.pricePerDay) {
        machineryData.pricePerDay = Math.round(parseFloat(formData.pricePerDay) * 100) / 100;
      }
      if (formData.pricePerWeek) {
        machineryData.pricePerWeek = Math.round(parseFloat(formData.pricePerWeek) * 100) / 100;
      }
      if (formData.pricePerAcre) {
        machineryData.pricePerAcre = Math.round(parseFloat(formData.pricePerAcre) * 100) / 100;
      }

      machineryData.images = images;

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
            <Link to="/"><img src="/images/home/DertWerk Logo.png" alt="DertWerk" style={{ maxWidth: '120px', marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} /></Link>
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
            <label htmlFor="zipCode">Zip Code (location of equipment) *</label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={e => setFormData(prev => ({ ...prev, zipCode: e.target.value.replace(/\D/g, '').slice(0, 5) }))}
              required
              maxLength={5}
              inputMode="numeric"
              placeholder="e.g., 58046"
            />
            <small>5-digit US zip code where the equipment is located</small>
          </div>

          <div className="form-group">
            <ImageUploader
              images={images}
              machineryId={id!}
              onChange={setImages}
            />
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
