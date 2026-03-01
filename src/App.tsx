import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, User, LayoutGrid, Bell } from 'lucide-react';
import { NotificationProvider, useNotifications } from './components/NotificationProvider';
import Storefront from './pages/Storefront';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import Cart from './pages/Cart';
import ProductDetail from './pages/ProductDetail';
import CategoryPage from './pages/CategoryPage';

const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <AdminLogin />;
  }
  return <>{children}</>;
};

const Navigation = () => {
  const location = useLocation();
  const { unreadCount } = useNotifications();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-6 py-3 z-50">
      <div className="max-w-md mx-auto flex justify-between items-center">
        <Link to="/" className={`flex flex-col items-center gap-1 ${location.pathname === '/' ? 'text-orange-500' : 'text-gray-400'}`}>
          <Home size={24} />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link to="/categories" className={`flex flex-col items-center gap-1 ${location.pathname === '/categories' ? 'text-orange-500' : 'text-gray-400'}`}>
          <LayoutGrid size={24} />
          <span className="text-[10px] font-medium">Categories</span>
        </Link>
        <Link to="/cart" className={`flex flex-col items-center gap-1 ${location.pathname === '/cart' ? 'text-orange-500' : 'text-gray-400'}`}>
          <ShoppingCart size={24} />
          <span className="text-[10px] font-medium">Cart</span>
        </Link>
        <Link to="/admin" className={`flex flex-col items-center gap-1 relative ${isAdmin ? 'text-orange-500' : 'text-gray-400'}`}>
          <User size={24} />
          <span className="text-[10px] font-medium">Admin</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
              {unreadCount}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
};

export default function App() {
  return (
    <NotificationProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 pb-20">
          <Routes>
            <Route path="/" element={<Storefront />} />
            <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/categories" element={<CategoryPage />} />
          </Routes>
          <Navigation />
        </div>
      </Router>
    </NotificationProvider>
  );
}
