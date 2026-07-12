import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { isLoggedIn } from './api';
import Catalog from './pages/Catalog';
import Service from './pages/Service';
import Login from './pages/Login';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';

/** 로그인이 필요한 화면. 없으면 로그인으로 보내고, 끝나면 돌아온다. */
function Private({ children }: { children: React.ReactNode }) {
  if (!isLoggedIn()) {
    sessionStorage.setItem('sgsg.after-login', window.location.pathname);
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/service/:id" element={<Service />} />
        <Route path="/login" element={<Login />} />
        <Route path="/orders" element={<Private><Orders /></Private>} />
        <Route path="/orders/:id" element={<Private><OrderDetail /></Private>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
