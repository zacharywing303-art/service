import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { Card, Badge } from '@openfsm/ui';

export default function CustomerDetail() {
  const { id } = useParams();
  const { data: customer, isLoading } = useQuery({ queryKey: ['customer', id], queryFn: () => api.get<any>(`/customers/${id}`) });
  const { data: locations } = useQuery({ queryKey: ['customer-locations', id], queryFn: () => api.get<any>(`/customers/${id}/locations`) });

  if (isLoading) return <div>Loading...</div>;
  if (!customer) return <div>Customer not found</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{customer.firstName} {customer.lastName}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-semibold mb-4">Contact Info</h2>
          <div className="space-y-2 text-sm">
            {customer.email && <div><span className="text-gray-500">Email:</span> {customer.email}</div>}
            {customer.phone && <div><span className="text-gray-500">Phone:</span> {customer.phone}</div>}
            {customer.companyName && <div><span className="text-gray-500">Company:</span> {customer.companyName}</div>}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold mb-4">Locations</h2>
          {locations?.map((loc: any) => (
            <div key={loc.id} className="text-sm mb-2">
              <div className="font-medium">{loc.name || 'Primary'}</div>
              <div className="text-gray-500">{loc.address1}, {loc.city}, {loc.state} {loc.zip}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
