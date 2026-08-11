import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Unauthorized from './pages/Unauthorized';

import CustomerList from './pages/customers/CustomerList';
import CustomerDetail from './pages/customers/CustomerDetail';
import ProductList from './pages/products/ProductList';
import ProductDetail from './pages/products/ProductDetail';
import ChallanList from './pages/challans/ChallanList';
import ChallanCreate from './pages/challans/ChallanCreate';
import ChallanDetail from './pages/challans/ChallanDetail';

const App = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                
                <Route path="/customers" element={<ProtectedRoute roles={['ADMIN', 'SALES', 'ACCOUNTS']} />}>
                  <Route index element={<CustomerList />} />
                  <Route path=":id" element={<CustomerDetail />} />
                </Route>

                <Route path="/products" element={<ProtectedRoute />}>
                  <Route index element={<ProductList />} />
                  <Route path=":id" element={<ProtectedRoute roles={['ADMIN', 'SALES', 'WAREHOUSE']} />}>
                    <Route index element={<ProductDetail />} />
                  </Route>
                </Route>

                <Route path="/challans" element={<ProtectedRoute />}>
                  <Route index element={<ChallanList />} />
                  <Route path="create" element={<ProtectedRoute roles={['ADMIN', 'SALES']} />}>
                    <Route index element={<ChallanCreate />} />
                  </Route>
                  <Route path=":id" element={<ChallanDetail />} />
                </Route>

                <Route path="/unauthorized" element={<Unauthorized />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
