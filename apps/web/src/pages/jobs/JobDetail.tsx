import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { Card, Badge } from '@openfsm/ui';

export default function JobDetail() {
  const { id } = useParams();
  const { data: job, isLoading } = useQuery({ queryKey: ['job', id], queryFn: () => api.get<any>(`/jobs/${id}`) });
  if (isLoading) return <div>Loading...</div>;
  if (!job) return <div>Job not found</div>;
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Job #{job.number}: {job.title}</h1>
        <Badge variant={job.status === 'completed' ? 'success' : job.status === 'in_progress' ? 'warning' : 'default'}>{job.status}</Badge>
      </div>
      <Card>
        <div className="space-y-3 text-sm">
          {job.description && <div><span className="font-medium">Description:</span> {job.description}</div>}
          <div><span className="font-medium">Priority:</span> {job.priority}</div>
          {job.scheduledStart && <div><span className="font-medium">Scheduled:</span> {new Date(job.scheduledStart).toLocaleString()}</div>}
        </div>
      </Card>
    </div>
  );
}
