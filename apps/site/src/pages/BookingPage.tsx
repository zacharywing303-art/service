import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Input, Card } from '@openfsm/ui';

export default function BookingPage() {
  const [form, setForm] = useState({ customerName: '', customerEmail: '', customerPhone: '', serviceRequested: '', preferredDate: '', description: '', address: '' });
  const [submitted, setSubmitted] = useState(false);

  const bookMutation = useMutation({
    mutationFn: () => fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, preferredDate: new Date(form.preferredDate).toISOString() }),
    }).then((r) => { if (!r.ok) throw new Error('Booking failed'); return r.json(); }),
    onSuccess: () => setSubmitted(true),
  });

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">Booking Submitted!</h2>
          <p className="text-gray-600">We'll contact you shortly to confirm your appointment.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <Card className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Book a Service</h1>
        <form onSubmit={(e) => { e.preventDefault(); bookMutation.mutate(); }} className="space-y-4">
          <Input label="Your Name" value={form.customerName} onChange={update('customerName')} required />
          <Input label="Email" type="email" value={form.customerEmail} onChange={update('customerEmail')} required />
          <Input label="Phone" value={form.customerPhone} onChange={update('customerPhone')} />
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Service Needed</label>
            <select value={form.serviceRequested} onChange={update('serviceRequested')} required className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
              <option value="">Select a service</option>
              <option>AC Repair</option>
              <option>AC Installation</option>
              <option>Furnace Repair</option>
              <option>Duct Cleaning</option>
              <option>Maintenance Tune-Up</option>
              <option>Emergency Service</option>
            </select>
          </div>
          <Input label="Preferred Date" type="date" value={form.preferredDate} onChange={update('preferredDate')} required />
          <Input label="Address" value={form.address} onChange={update('address')} />
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea value={form.description} onChange={update('description')} rows={3} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" placeholder="Describe the issue..." />
          </div>
          <Button type="submit" className="w-full" disabled={bookMutation.isPending}>
            {bookMutation.isPending ? 'Submitting...' : 'Request Booking'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
