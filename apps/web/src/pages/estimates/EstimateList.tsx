import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { Badge, Button } from '@openfsm/ui';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  draft: 'default', sent: 'info', approved: 'success', declined: 'danger', converted: 'success',
};

export default function EstimateList() {
  const { data, isLoading } = useQuery({ queryKey: ['estimates'], queryFn: () => api.get<any>('/estimates') });
  if (isLoading) return <div>Loading...</div>;
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Estimates</h1>
        <Button>New Estimate</Button>
      </div>
      <div className="bg-white rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data?.data?.map((est: any) => (
              <tr key={est.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{est.number}</td>
                <td className="px-6 py-4"><Badge variant={statusColors[est.status]}>{est.status}</Badge></td>
                <td className="px-6 py-4 text-right text-sm">${est.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
