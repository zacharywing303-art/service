import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { Card } from '@openfsm/ui';

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => api.get<any>('/reports/dashboard') });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-sm text-gray-500">Outstanding Invoices</div>
          <div className="text-2xl font-bold">{data?.outstandingInvoices?.count || 0}</div>
          <div className="text-sm text-gray-500">${data?.outstandingInvoices?.total || '0.00'}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Revenue This Month</div>
          <div className="text-2xl font-bold">${data?.revenueThisMonth || '0.00'}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Jobs Today</div>
          <div className="text-2xl font-bold">{data?.jobsToday || 0}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Estimate Approval Rate</div>
          <div className="text-2xl font-bold">{data?.estimateApprovalRate || 0}%</div>
        </Card>
      </div>
    </div>
  );
}
