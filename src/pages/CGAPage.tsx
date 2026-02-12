import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const backgroundImages = [
  '/images/cga/20201024_111856 (1).jpg',
  '/images/cga/20240908_195042 (1).jpg',
  '/images/cga/20240908_195117.jpg',
  '/images/cga/20240908_195157.jpg',
  '/images/cga/20250622_184020.jpg',
  '/images/cga/20251222_171137.jpg'
];

function CGAPage() {
  const [backgroundImage, setBackgroundImage] = useState('');

  useEffect(() => {
    // Randomly select a background image
    const randomImage = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
    setBackgroundImage(randomImage);
  }, []);

  return (
    <main
      className="page-container"
      style={{
        backgroundImage: `url('${backgroundImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="page-content">
        <img src="/images/home/cga-logo.png" alt="Colgate Grain & Agronomy, LLC" style={{ maxWidth: '200px', marginBottom: '1rem' }} />
        <p>Contact us for more information on agronomic input pooling and custom grain drying.</p>

        <Link to="/" className="back-link">← Back to Home</Link>
      </div>
    </main>
  );
}

export default CGAPage;
