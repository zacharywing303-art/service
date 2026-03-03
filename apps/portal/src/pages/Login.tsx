import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button, Input, Card } from '@openfsm/ui';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState('');
  const navigate = useNavigate();

  const requestLink = useMutation({
    mutationFn: () => fetch('/api/portal/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).then((r) => r.json()),
    onSuccess: (data: any) => {
      setSent(true);
      if (data.token) setToken(data.token); // dev mode
    },
  });

  const verifyLink = useMutation({
    mutationFn: () => fetch('/api/portal/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then((r) => r.json()),
    onSuccess: (data: any) => {
      localStorage.setItem('portal_token', data.token);
      navigate('/dashboard');
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Customer Portal</h1>
        {!sent ? (
          <form onSubmit={(e) => { e.preventDefault(); requestLink.mutate(); }} className="space-y-4">
            <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={requestLink.isPending}>Send Magic Link</Button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-green-600 text-center">Magic link sent! Check your email.</p>
            {token && (
              <div>
                <p className="text-sm text-gray-500 mb-2">(Dev mode: click to verify)</p>
                <Button onClick={() => verifyLink.mutate()} className="w-full">Verify & Login</Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
