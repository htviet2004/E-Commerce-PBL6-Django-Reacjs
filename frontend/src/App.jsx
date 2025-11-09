import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/AuthContext';
import { CartProvider } from './utils/CartContext';
import PrivateRoute from './components/PrivateRoute';
import Header from './components/Header';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import SellerDashboard from './pages/SellerDashboard';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import UserList from './pages/UserList';
import AddProduct from './pages/AddProduct';
import AddCategory from './pages/AddCategory';
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage.jsx';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="App">
            <Header />
            <Routes>
              {/* Home làm trang mặc định */}
              <Route index element={<Home />} />
              <Route path="/" element={<Home />} />

              {/* Category page */}
              <Route path="/category/:slug" element={<CategoryPage />} />

              {/* Product Detail */}
              <Route path="/product/:id" element={<ProductDetail />} />

              {/* Cart */}
              <Route path="/cart" element={<Cart />} />

              {/* giữ các route khác */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Buyer */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute allowedRoles={['buyer']}>
                    <Dashboard />
                  </PrivateRoute>
                }
              />

              {/* Seller */}
              <Route
                path="/seller/dashboard"
                element={
                  <PrivateRoute allowedRoles={['seller']}>
                    <SellerDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/seller/products/new"
                element={
                  <PrivateRoute allowedRoles={['seller']}>
                    <AddProduct />
                  </PrivateRoute>
                }
              />

              {/* Admin */}
              <Route
                path="/admin/dashboard"
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/categories/new"
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <AddCategory />
                  </PrivateRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <UserList />
                  </PrivateRoute>
                }
              />

              {/* Common protected */}
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/change-password"
                element={
                  <PrivateRoute>
                    <ChangePassword />
                  </PrivateRoute>
                }
              />

              {/* Default */}
              <Route path="*" element={<RoleBasedRedirect />} />
            </Routes>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

const RoleBasedRedirect = () => {
  const { user, getDefaultRoute } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={getDefaultRoute(user.user_type)} />;
};

export default App;