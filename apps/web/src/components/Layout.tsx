import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const nav = [
  { path: '/', label: 'Dashboard' },
  { path: '/customers', label: 'Customers' },
  { path: '/jobs', label: 'Jobs' },
  { path: '/estimates', label: 'Estimates' },
  { path: '/invoices', label: 'Invoices' },
  { path: '/payments', label: 'Payments' },
];

export default function Layout() {
  const location = useLocation();
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="text-xl font-bold text-blue-600 mb-8">OpenFSM</div>
        <nav className="space-y-1">
          {nav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === item.path ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
