import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Badge } from '@openfsm/ui';

const portalApi = (path: string) => fetch(`/api/portal${path}`, {
  headers: { Authorization: `Bearer ${localStorage.getItem('portal_token')}` },
}).then((r) => r.json());

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['portal-dashboard'], queryFn: () => portalApi('/dashboard') });

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4 flex justify-between items-center">
        <h1 className="text-lg font-bold">Customer Portal</h1>
        <Link to="/messages" className="text-blue-600 hover:underline">Messages {data?.unreadMessages > 0 && <Badge variant="danger">{data.unreadMessages}</Badge>}</Link>
      </header>
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <Card>
          <h2 className="font-semibold mb-3">Recent Jobs</h2>
          {data?.recentJobs?.length === 0 && <p className="text-gray-500 text-sm">No recent jobs</p>}
          {data?.recentJobs?.map((job: any) => (
            <div key={job.id} className="flex justify-between py-2 border-b last:border-0">
              <span>{job.title}</span>
              <Badge>{job.status}</Badge>
            </div>
          ))}
        </Card>
        <Card>
          <h2 className="font-semibold mb-3">Open Invoices</h2>
          {data?.recentInvoices?.filter((i: any) => i.status !== 'paid' && i.status !== 'void').map((inv: any) => (
            <div key={inv.id} className="flex justify-between py-2 border-b last:border-0">
              <span>{inv.number}</span>
              <span className="font-medium">${inv.balanceDue}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
