import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { Badge, Button } from '@openfsm/ui';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'default', scheduled: 'info', in_progress: 'warning', completed: 'success', cancelled: 'danger',
};

export default function JobList() {
  const { data, isLoading } = useQuery({ queryKey: ['jobs'], queryFn: () => api.get<any>('/jobs') });
  if (isLoading) return <div>Loading...</div>;
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <Button>New Job</Button>
      </div>
      <div className="bg-white rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data?.data?.map((job: any) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{job.number}</td>
                <td className="px-6 py-4"><Link to={`/jobs/${job.id}`} className="text-blue-600 hover:underline">{job.title}</Link></td>
                <td className="px-6 py-4"><Badge variant={statusColors[job.status]}>{job.status}</Badge></td>
                <td className="px-6 py-4 text-sm">{job.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
