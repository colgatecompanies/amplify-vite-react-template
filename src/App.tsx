import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';
import CGAPage from './pages/CGAPage';
import CMCPage from './pages/CMCPage';
import EquipmentPage from './pages/EquipmentPage';
import AdminPage from './pages/AdminPage';
import AdminEquipmentListPage from './pages/AdminEquipmentListPage';
import AdminEquipmentEditPage from './pages/AdminEquipmentEditPage';
import DashboardPage from './pages/DashboardPage';
import EquipmentDetailPage from './pages/EquipmentDetailPage';
import MyReservationsPage from './pages/MyReservationsPage';
import OwnerReservationsPage from './pages/OwnerReservationsPage';
import AdminReservationsPage from './pages/AdminReservationsPage';
import AuthHeader from './components/AuthHeader';

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
      <AuthHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cga" element={<CGAPage />} />
        <Route path="/cmc" element={<CMCPage />} />
        <Route path="/equipment" element={<EquipmentPage />} />
        <Route path="/equipment/:id" element={<EquipmentDetailPage />} />
        <Route
          path="/admin"
          element={
            <Authenticator hideSignUp={true}>
              <AdminEquipmentListPage />
            </Authenticator>
          }
        />
        <Route
          path="/admin/equipment/add"
          element={
            <Authenticator hideSignUp={true}>
              <AdminPage />
            </Authenticator>
          }
        />
        <Route
          path="/admin/equipment/edit/:id"
          element={
            <Authenticator hideSignUp={true}>
              <AdminEquipmentEditPage />
            </Authenticator>
          }
        />
        <Route
          path="/admin/reservations"
          element={
            <Authenticator hideSignUp={true}>
              <AdminReservationsPage />
            </Authenticator>
          }
        />
        {/* User dashboard routes - signup allowed */}
        <Route
          path="/dashboard"
          element={
            <Authenticator>
              <DashboardPage />
            </Authenticator>
          }
        />
        <Route
          path="/dashboard/equipment/add"
          element={
            <Authenticator>
              <AdminPage />
            </Authenticator>
          }
        />
        <Route
          path="/dashboard/equipment/edit/:id"
          element={
            <Authenticator>
              <AdminEquipmentEditPage />
            </Authenticator>
          }
        />
        <Route
          path="/dashboard/reservations"
          element={
            <Authenticator>
              <MyReservationsPage />
            </Authenticator>
          }
        />
        <Route
          path="/dashboard/reservations/manage"
          element={
            <Authenticator>
              <OwnerReservationsPage />
            </Authenticator>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
