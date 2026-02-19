import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import MachineryCard from '../components/MachineryCard';
import { EQUIPMENT_CATEGORIES } from '../constants/categories';
import '../App.css';

const client = generateClient<Schema>();

function EquipmentPage() {
  const [machinery, setMachinery] = useState<Array<Schema['Machinery']['type']>>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchMachinery();
  }, []);

  async function fetchMachinery() {
    try {
      const { data } = await client.models.Machinery.list({
        authMode: 'apiKey'
      });
      // Only show approved listings on the public page
      const approved = data.filter(item => item.listingStatus === 'APPROVED' && item.available !== false);
      setMachinery(approved);
    } catch (error) {
      console.error('Error fetching machinery:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredMachinery = activeCategory
    ? machinery.filter(item => item.category === activeCategory)
    : machinery;

  return (
    <main className="page-container container">
      <div className="equipment-content">
        <div className="equipment-header">
          <img src="/images/home/cmc-logo.png" alt="Colgate Machinery Company, LLC" style={{ maxWidth: '150px', marginBottom: '1rem' }} />
          <h1>Equipment Rental</h1>
          <p>Browse our available machinery for rent</p>
          <Link to="/dashboard" className="equipment-link">List, Manage or Reserve Equipment</Link>
        </div>

        {!loading && machinery.length > 0 && (
          <div className="category-filters">
            <button
              className={`category-filter-button${activeCategory === null ? ' active' : ''}`}
              onClick={() => setActiveCategory(null)}
            >
              All
            </button>
            {EQUIPMENT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`category-filter-button${activeCategory === cat ? ' active' : ''}`}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p>Loading equipment...</p>
        ) : machinery.length === 0 ? (
          <div className="no-equipment">
            <p>No equipment available at this time.</p>
            <p>Check back soon or contact us for more information.</p>
          </div>
        ) : filteredMachinery.length === 0 ? (
          <div className="no-equipment">
            <p>No equipment found in this category.</p>
          </div>
        ) : (
          <div className="machinery-grid">
            {filteredMachinery.map((item) => (
              <MachineryCard key={item.id} machinery={item} />
            ))}
          </div>
        )}

        <Link to="/cmc" className="back-link">← Back to CMC</Link>
      </div>
    </main>
  );
}

export default EquipmentPage;
