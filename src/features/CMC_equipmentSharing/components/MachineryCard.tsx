import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Schema } from '../../../../amplify/data/resource';
import { resolveImageUrl } from '../../shared/utils/storageUtils';
import { getZipCoords } from '../../shared/utils/zipCodeUtils';

interface MachineryCardProps {
  machinery: Schema['Machinery']['type'];
  distanceMiles?: number;
}

function MachineryCard({ machinery, distanceMiles }: MachineryCardProps) {
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [zipLabel, setZipLabel] = useState<string | null>(null);

  useEffect(() => {
    const firstImage = machinery.images?.[0];
    if (firstImage) {
      resolveImageUrl(firstImage).then(setImageUrl);
    }
  }, [machinery.images]);

  useEffect(() => {
    if (!machinery.zipCode) return;
    getZipCoords(machinery.zipCode).then(coords => {
      if (coords) {
        setZipLabel(`${coords.city}, ${coords.state} (${machinery.zipCode})`);
      } else {
        setZipLabel(machinery.zipCode ?? null);
      }
    });
  }, [machinery.zipCode]);

  return (
    <Link to={`/equipment/${machinery.id}`} className="machinery-card-link">
    <div className="machinery-card">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={machinery.name}
          className="machinery-image"
        />
      )}
      <div className="machinery-info">
        <h3>{machinery.name}</h3>
        {machinery.description && <p>{machinery.description}</p>}
        <div className="machinery-pricing">
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
        {machinery.category && (
          <span className="machinery-category">{machinery.category}</span>
        )}
        <div className="machinery-location">
          {zipLabel && (
            <span className="machinery-zip">{zipLabel}</span>
          )}
          {distanceMiles !== undefined && (
            <span className="machinery-distance">
              {distanceMiles < 1
                ? '< 1 mi away'
                : `${Math.round(distanceMiles)} mi away`}
            </span>
          )}
        </div>
        {machinery.available === false && (
          <div className="machinery-status">
            <span className="unavailable">Hidden</span>
          </div>
        )}
      </div>
    </div>
    </Link>
  );
}

export default MachineryCard;
