import { Link } from 'react-router-dom';
import { Schema } from '../../amplify/data/resource';

interface MachineryCardProps {
  machinery: Schema['Machinery']['type'];
}

function MachineryCard({ machinery }: MachineryCardProps) {
  return (
    <Link to={`/equipment/${machinery.id}`} className="machinery-card-link">
    <div className="machinery-card">
      {machinery.images && machinery.images.length > 0 && (
        <img
          src={machinery.images[0] ?? undefined}
          alt={machinery.name}
          className="machinery-image"
        />
      )}
      <div className="machinery-info">
        <h3>{machinery.name}</h3>
        {machinery.description && <p>{machinery.description}</p>}
        <div className="machinery-pricing">
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
        {machinery.category && (
          <span className="machinery-category">{machinery.category}</span>
        )}
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
