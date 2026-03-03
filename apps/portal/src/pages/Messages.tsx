import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card } from '@openfsm/ui';

const portalApi = (path: string, options?: RequestInit) => fetch(`/api/portal${path}`, {
  ...options,
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('portal_token')}`, ...options?.headers },
}).then((r) => r.json());

export default function Messages() {
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();
  const { data: messages } = useQuery({ queryKey: ['portal-messages'], queryFn: () => portalApi('/messages') });

  const sendMutation = useMutation({
    mutationFn: () => portalApi('/messages', { method: 'POST', body: JSON.stringify({ content }) }),
    onSuccess: () => { setContent(''); queryClient.invalidateQueries({ queryKey: ['portal-messages'] }); },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4">
        <h1 className="text-lg font-bold">Messages</h1>
      </header>
      <div className="p-4 max-w-2xl mx-auto">
        <div className="space-y-3 mb-4">
          {(messages || []).map((msg: any) => (
            <div key={msg.id} className={`p-3 rounded-lg max-w-[80%] ${msg.isFromCustomer ? 'ml-auto bg-blue-100' : 'bg-white border'}`}>
              <p className="text-sm">{msg.content}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(msg.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); sendMutation.mutate(); }} className="flex gap-2">
          <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Type a message..." className="flex-1 rounded-md border px-3 py-2 text-sm" required />
          <Button type="submit" disabled={sendMutation.isPending}>Send</Button>
        </form>
      </div>
    </div>
  );
}
