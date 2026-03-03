import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Badge } from '@openfsm/ui';

const apiGet = (path: string) => fetch(`/api${path}`, { credentials: 'include' }).then((r) => r.json());
const apiPost = (path: string, body?: any) => fetch(`/api${path}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json());
const apiPatch = (path: string, body?: any) => fetch(`/api${path}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json());

export default function JobDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { data: job, isLoading } = useQuery({ queryKey: ['field-job', id], queryFn: () => apiGet(`/jobs/${id}`) });

  const statusMutation = useMutation({
    mutationFn: (status: string) => apiPatch(`/jobs/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['field-job', id] }),
  });

  const timerMutation = useMutation({
    mutationFn: () => apiPost(`/jobs/${id}/timer/start`),
  });

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (!job) return <div className="p-4">Job not found</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold">#{job.number} {job.title}</h2>
        <Badge>{job.status}</Badge>
      </div>
      <Card>
        <p className="text-sm text-gray-600">{job.description}</p>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        {job.status === 'scheduled' && (
          <Button onClick={() => statusMutation.mutate('in_progress')} className="col-span-2">Start Job</Button>
        )}
        {job.status === 'in_progress' && (
          <>
            <Button onClick={() => timerMutation.mutate()} variant="secondary">Start Timer</Button>
            <Button onClick={() => statusMutation.mutate('completed')}>Complete Job</Button>
          </>
        )}
      </div>
    </div>
  );
}
