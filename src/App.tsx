import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import CGAPage from './pages/CGAPage';
import CMCPage from './pages/CMCPage';

function HomePage() {
  return (
    <main className="container">
      <div className="content">
        <div className="companies">
          <Link to="/cga" className="company-card">
            <img src="/images/home/cga-logo.png" alt="Colgate Grain & Agronomy, LLC" className="company-logo" />
            <h2>Colgate Grain & Agronomy, LLC</h2>
          </Link>

          <Link to="/cmc" className="company-card">
            <img src="/images/home/cmc-logo.png" alt="Colgate Machinery Company, LLC" className="company-logo" />
            <h2>Colgate Machinery Company, LLC</h2>
          </Link>
        </div>

        <p className="tagline">Agronomy & Machinery Solutions</p>
      </div>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cga" element={<CGAPage />} />
        <Route path="/cmc" element={<CMCPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
