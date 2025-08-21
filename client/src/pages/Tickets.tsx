import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, endpoints } from '../lib/api';
import { Skeleton, SkeletonText } from '../components/Skeleton';
import { useToast } from '../components/Toaster';

interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: 'open' | 'triaged' | 'waiting_human' | 'resolved' | 'closed';
  category: 'billing' | 'tech' | 'shipping' | 'other';
  createdAt: string;
}

const Tickets: React.FC = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const { show } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: tickets, isLoading, isError } = useQuery({
    queryKey: ['tickets', statusFilter],
    queryFn: async () => {
      const res = await api.get(endpoints.tickets.list, { params: statusFilter ? { status: statusFilter } : undefined });
      return res.data as Ticket[];
    },
  });

  useEffect(() => {
    if (isError) {
      show('Failed to load tickets', 'error');
    }
  }, [isError, show]);

  const createTicket = useMutation({
    mutationFn: async () => {
      const res = await api.post(endpoints.tickets.create, { title, description });
      return res.data as Ticket;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setTitle('');
      setDescription('');
      show('Ticket created', 'success');
    },
    onError: () => {
      show('Failed to create ticket', 'error');
    }
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createTicket.mutateAsync();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
      <p className="mt-1 text-sm text-gray-500">Manage support tickets and view their status</p>

      <div className="mt-6 bg-white shadow rounded-lg p-6" aria-label="Create Ticket Form">
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        
          <textarea
            className="w-full border rounded px-3 py-2"
            placeholder="Describe your issue"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Ticket'}
          </button>
        </form>
      </div>

      <div className="mt-6 bg-white shadow rounded-lg" aria-live="polite">
        <div className="p-4 border-b font-medium">Recent Tickets</div>
        <div className="p-4 flex items-center gap-3">
          <label htmlFor="status" className="text-sm text-gray-600">Status</label>
          <select id="status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded px-2 py-1 text-sm">
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="triaged">Triaged</option>
            <option value="waiting_human">Waiting Human</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="divide-y">
          {isLoading && (
            <div className="p-4 space-y-3">
              <Skeleton className="h-5 w-1/3" />
              <SkeletonText lines={3} />
            </div>
          )}
          {isError && <div className="p-4 text-red-600">Failed to load tickets</div>}
          {tickets?.map((t) => (
            <Link key={t._id} to={`/tickets/${t._id}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div>
                <div className="font-medium">{t.title}</div>
                <div className="text-sm text-gray-500">{t.category} • {new Date(t.createdAt).toLocaleString()}</div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">{t.status}</span>
            </Link>
          ))}
          {!isLoading && tickets?.length === 0 && (
            <div className="p-4 text-gray-500">No tickets yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tickets;

