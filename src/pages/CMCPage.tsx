import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const backgroundImages = [
  '/images/cmc/20201024_111856 (2).jpg',
  '/images/cmc/IMG_20180708_181020759_HDR.jpg',
  '/images/cmc/ND_soybeans_MG_8352.jpg',
  '/images/cmc/ND_soybeans_MG_8652.jpg'
];

function CMCPage() {
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
        <img src="/images/home/cmc-logo.png" alt="Colgate Machinery Company, LLC" style={{ maxWidth: '200px', marginBottom: '1rem' }} />
        <p>Contact us for more information on machinery pooling and custom farming operations.</p>

        <Link to="/" className="back-link">← Back to Home</Link>
      </div>
    </main>
  );
}

export default CMCPage;
