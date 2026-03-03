import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import JobList from './pages/JobList.js';
import JobDetail from './pages/JobDetail.js';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-blue-600 text-white p-4">
            <h1 className="text-lg font-bold">Cool Blasters Field</h1>
          </header>
          <Routes>
            <Route path="/" element={<JobList />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
