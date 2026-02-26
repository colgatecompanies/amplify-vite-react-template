import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import MachineryCard from '../components/MachineryCard';
import { EQUIPMENT_CATEGORIES } from '../constants/categories';
import { getZipCoords, haversineDistanceMiles, ZipCoords } from '../../shared/utils/zipCodeUtils';
import '../../../App.css';

const client = generateClient<Schema>();

const DISTANCE_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: 'Any distance', value: null },
  { label: 'Within 25 mi', value: 25 },
  { label: 'Within 50 mi', value: 50 },
  { label: 'Within 100 mi', value: 100 },
  { label: 'Within 250 mi', value: 250 },
];

function EquipmentPage() {
  const [machinery, setMachinery] = useState<Array<Schema['Machinery']['type']>>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Location filter state
  const [userZip, setUserZip] = useState('');
  const [userCoords, setUserCoords] = useState<ZipCoords | null>(null);
  const [userZipError, setUserZipError] = useState('');
  const [zipLookupPending, setZipLookupPending] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const [equipmentCoords, setEquipmentCoords] = useState<Record<string, ZipCoords | null>>({});
  const zipDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchMachinery();
  }, []);

  async function fetchMachinery() {
    try {
      const { data } = await client.models.Machinery.list({
        authMode: 'apiKey'
      });
      const approved = data.filter(item => item.listingStatus === 'APPROVED' && item.available !== false);
      setMachinery(approved);
    } catch (error) {
      console.error('Error fetching machinery:', error);
    } finally {
      setLoading(false);
    }
  }

  // Pre-fetch coordinates for all equipment zip codes when machinery loads
  useEffect(() => {
    const uniqueZips = [
      ...new Set(machinery.map(m => m.zipCode).filter((z): z is string => !!z)),
    ];
    const unknownZips = uniqueZips.filter(z => !Object.prototype.hasOwnProperty.call(equipmentCoords, z));
    if (unknownZips.length === 0) return;

    Promise.all(
      unknownZips.map(async z => {
        const coords = await getZipCoords(z);
        return [z, coords] as [string, ZipCoords | null];
      })
    ).then(results => {
      setEquipmentCoords(prev => {
        const next = { ...prev };
        for (const [z, coords] of results) {
          next[z] = coords;
        }
        return next;
      });
    });
  }, [machinery]);

  // Debounced lookup when user types their zip code
  useEffect(() => {
    if (zipDebounceRef.current) clearTimeout(zipDebounceRef.current);

    if (userZip.length === 0) {
      setUserCoords(null);
      setUserZipError('');
      setZipLookupPending(false);
      return;
    }

    if (!/^\d{5}$/.test(userZip)) {
      setUserCoords(null);
      setUserZipError('');
      setZipLookupPending(false);
      return;
    }

    setZipLookupPending(true);
    setUserZipError('');

    zipDebounceRef.current = setTimeout(async () => {
      const coords = await getZipCoords(userZip);
      setZipLookupPending(false);
      if (coords) {
        setUserCoords(coords);
        setUserZipError('');
      } else {
        setUserCoords(null);
        setUserZipError('Zip code not found.');
      }
    }, 400);

    return () => {
      if (zipDebounceRef.current) clearTimeout(zipDebounceRef.current);
    };
  }, [userZip]);

  function getItemDistance(item: Schema['Machinery']['type']): number | null {
    if (!userCoords || !item.zipCode) return null;
    const eqCoords = equipmentCoords[item.zipCode];
    if (!eqCoords) return null;
    return haversineDistanceMiles(userCoords.lat, userCoords.lng, eqCoords.lat, eqCoords.lng);
  }

  const distanceByItemId: Record<string, number | null> = {};
  for (const item of machinery) {
    distanceByItemId[item.id] = getItemDistance(item);
  }

  const filteredMachinery = machinery.filter(item => {
    if (activeCategory && item.category !== activeCategory) return false;
    if (maxDistance !== null && userCoords) {
      const dist = distanceByItemId[item.id];
      // Items without a zip code pass through — we can't know their distance
      if (dist !== null && dist > maxDistance) return false;
    }
    return true;
  });

  const distanceFilterActive = maxDistance !== null && !!userCoords;

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
          <>
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

            <div className="location-filter">
              {DISTANCE_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  className={`category-filter-button${maxDistance === opt.value ? ' active' : ''}`}
                  onClick={() => setMaxDistance(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
              <span className="location-filter-connector">of ZIP</span>
              <input
                id="userZip"
                type="text"
                inputMode="numeric"
                maxLength={5}
                placeholder="Enter zip"
                value={userZip}
                onChange={e => setUserZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                className={`location-zip-input${userZipError ? ' input-error' : ''}`}
              />
              {zipLookupPending && <span className="zip-lookup-status">Looking up...</span>}
              {!zipLookupPending && userCoords && <span className="zip-lookup-status zip-lookup-ok">✓ {userCoords.city}, {userCoords.state}</span>}
              {!zipLookupPending && userZipError && <span className="zip-lookup-status zip-lookup-error">{userZipError}</span>}
            </div>
          </>
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
            <p>No equipment found matching your filters.</p>
            {distanceFilterActive && (
              <p>Try expanding your distance or removing the distance filter.</p>
            )}
          </div>
        ) : (
          <div className="machinery-grid">
            {filteredMachinery.map((item) => (
              <MachineryCard
                key={item.id}
                machinery={item}
                distanceMiles={distanceByItemId[item.id] ?? undefined}
              />
            ))}
          </div>
        )}

        <Link to="/cmc" className="back-link">← Back to CMC</Link>
      </div>
    </main>
  );
}

export default EquipmentPage;
