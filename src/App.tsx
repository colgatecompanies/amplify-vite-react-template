import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';
import CMCPage from './pages/CMCPage';
import EquipmentPage from './features/CMC_equipmentSharing/pages/EquipmentPage';
import AdminPage from './features/CMC_equipmentSharing/pages/AdminPage';
import AdminEquipmentListPage from './features/CMC_equipmentSharing/pages/AdminEquipmentListPage';
import AdminEquipmentEditPage from './features/CMC_equipmentSharing/pages/AdminEquipmentEditPage';
import DashboardPage from './features/CMC_equipmentSharing/pages/DashboardPage';
import EquipmentDetailPage from './features/CMC_equipmentSharing/pages/EquipmentDetailPage';
import MyReservationsPage from './features/CMC_equipmentSharing/pages/MyReservationsPage';
import OwnerReservationsPage from './features/CMC_equipmentSharing/pages/OwnerReservationsPage';
import AdminReservationsPage from './features/CMC_equipmentSharing/pages/AdminReservationsPage';
import AuthHeader from './features/shared/components/AuthHeader';
import { useRandomBackground } from './features/shared/hooks/useRandomBackground';

function App() {
  const bgStyle = useRandomBackground();

  return (
    <BrowserRouter>
      <div className="app-background" style={bgStyle}>
      <AuthHeader />
      <Routes>
        <Route path="/" element={<CMCPage />} />
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
      </div>
    </BrowserRouter>
  );
}

export default App;
