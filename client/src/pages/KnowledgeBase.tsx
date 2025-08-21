import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, endpoints } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton, SkeletonText } from '../components/Skeleton';
import { useToast } from '../components/Toaster';

interface Article { _id: string; title: string; body: string; tags: string[]; status: 'draft'|'published' }

const KnowledgeBase: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { show } = useToast();
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<'draft'|'published'>('draft');

  const { data: articles, isLoading, isError } = useQuery({
    queryKey: ['kb', query],
    queryFn: async () => {
      const res = await api.get(endpoints.kb.search, { params: { query } });
      return res.data as Article[];
    },
  });

  useEffect(() => {
    if (isError) show('Failed to load articles', 'error');
  }, [isError, show]);

  const create = useMutation({
    mutationFn: async () => {
      const res = await api.post(endpoints.kb.create, { title, body, tags: tags.split(',').map(t => t.trim()).filter(Boolean), status });
      return res.data as Article;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['kb'] });
      setTitle(''); setBody(''); setTags(''); setStatus('draft');
      show('Article created', 'success');
    },
    onError: () => show('Failed to create article', 'error')
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
      <p className="mt-1 text-sm text-gray-500">Search and manage knowledge base articles</p>

      <div className="mt-6 bg-white shadow rounded-lg p-6 space-y-4" aria-label="Knowledge Base Search">
        <input className="w-full border rounded px-3 py-2" placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="divide-y">
          {isLoading && (
            <div className="py-2">
              <Skeleton className="h-5 w-1/4 mb-2" />
              <SkeletonText lines={4} />
            </div>
          )}
          {articles?.map(a => (
            <div key={a._id} className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-sm text-gray-500">{a.tags.join(', ')}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${a.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{a.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h3 className="font-semibold mb-3">Create Article</h3>
          <form onSubmit={(e) => { e.preventDefault(); void create.mutateAsync(); }} className="space-y-3">
            <input className="w-full border rounded px-3 py-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <textarea className="w-full border rounded px-3 py-2" placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} required />
            <input className="w-full border rounded px-3 py-2" placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
            <select className="w-full border rounded px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Create</button>
          </form>
        </div>
      )}
      {user?.role !== 'admin' && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-4">
          Read-only view: ask an admin to create or update articles.
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;

