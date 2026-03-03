import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { Badge } from '@openfsm/ui';

export default function PaymentList() {
  const { data, isLoading } = useQuery({ queryKey: ['payments'], queryFn: () => api.get<any>('/payments') });
  if (isLoading) return <div>Loading...</div>;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Payments</h1>
      <div className="bg-white rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data?.data?.map((p: any) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{new Date(p.processedAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm">{p.method}</td>
                <td className="px-6 py-4"><Badge variant={p.status === 'completed' ? 'success' : 'warning'}>{p.status}</Badge></td>
                <td className="px-6 py-4 text-right text-sm font-medium">${p.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
