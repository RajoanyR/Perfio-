import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MaPerformance from './pages/MaPerformance.jsx';
import AnalyseKpi from './pages/AnalyseKpi.jsx';
import Projets from './pages/Projets.jsx';
import ProjetDetail from './pages/ProjetDetail.jsx';
import Taches from './pages/Taches.jsx';
import TacheDetail from './pages/TacheDetail.jsx';
import SuiviTemps from './pages/SuiviTemps.jsx';
import Equipes from './pages/Equipes.jsx';
import Collaborateurs from './pages/Collaborateurs.jsx';
import Notifications from './pages/Notifications.jsx';
import Rapports from './pages/Rapports.jsx';
import Parametres from './pages/Parametres.jsx';
import Roles from './pages/Roles.jsx';
import Permissions from './pages/Permissions.jsx';
import NonTrouve from './pages/NonTrouve.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/performance" element={<MaPerformance />} />
          <Route path="/kpi" element={<AnalyseKpi />} />
          <Route path="/rapports" element={<Rapports />} />
          <Route path="/projets" element={<Projets />} />
          <Route path="/projets/:id" element={<ProjetDetail />} />
          <Route path="/taches" element={<Taches />} />
          <Route path="/taches/:id" element={<TacheDetail />} />
          <Route path="/suivi-temps" element={<SuiviTemps />} />
          <Route path="/equipes" element={<Equipes />} />
          <Route path="/collaborateurs" element={<Collaborateurs />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/parametres" element={<Parametres />} />
          {/* Administration : visible seulement pour le rôle administrateur */}
          <Route element={<ProtectedRoute admin />}>
            <Route path="/roles" element={<Roles />} />
            <Route path="/permissions" element={<Permissions />} />
          </Route>
          <Route path="*" element={<NonTrouve />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
