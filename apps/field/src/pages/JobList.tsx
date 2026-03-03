import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@openfsm/ui';

const api = (path: string) => fetch(`/api${path}`, { credentials: 'include' }).then((r) => r.json());

export default function JobList() {
  const { data, isLoading } = useQuery({ queryKey: ['field-jobs'], queryFn: () => api('/jobs?status=scheduled&limit=20') });
  if (isLoading) return <div className="p-4">Loading jobs...</div>;
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-lg font-semibold">Today's Jobs</h2>
      {data?.data?.map((job: any) => (
        <Link key={job.id} to={`/jobs/${job.id}`} className="block bg-white rounded-lg border p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">#{job.number} {job.title}</div>
              <div className="text-sm text-gray-500 mt-1">{job.description}</div>
            </div>
            <Badge variant={job.priority === 'emergency' ? 'danger' : job.priority === 'high' ? 'warning' : 'default'}>{job.priority}</Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}
