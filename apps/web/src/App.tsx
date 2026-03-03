import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from './lib/api.js';
import Login from './pages/Login.js';
import Dashboard from './pages/Dashboard.js';
import CustomerList from './pages/customers/CustomerList.js';
import CustomerDetail from './pages/customers/CustomerDetail.js';
import JobList from './pages/jobs/JobList.js';
import JobDetail from './pages/jobs/JobDetail.js';
import EstimateList from './pages/estimates/EstimateList.js';
import InvoiceList from './pages/invoices/InvoiceList.js';
import PaymentList from './pages/payments/PaymentList.js';
import Layout from './components/Layout.js';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useQuery({ queryKey: ['me'], queryFn: () => api.get('/auth/me'), retry: false });
  if (isLoading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" /></div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="jobs" element={<JobList />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="estimates" element={<EstimateList />} />
        <Route path="invoices" element={<InvoiceList />} />
        <Route path="payments" element={<PaymentList />} />
      </Route>
    </Routes>
  );
}
