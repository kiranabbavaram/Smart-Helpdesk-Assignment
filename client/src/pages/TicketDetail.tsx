import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton, SkeletonText } from '../components/Skeleton';
import { api, endpoints } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: string;
  category: string;
}

const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [reply, setReply] = useState('');

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get(endpoints.tickets.get(id!));
      return res.data as Ticket;
    },
  });

  const { data: suggestion } = useQuery({
    queryKey: ['suggestion', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get(endpoints.agent.suggestion(id!));
      return res.data as { draftReply: string; confidence: number; predictedCategory: string };
    },
  });

  const { data: audit } = useQuery({
    queryKey: ['audit', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get(endpoints.audit.ticketAudit(id!));
      return res.data as Array<{ action: string; actor: 'system'|'agent'|'user'; meta?: Record<string, unknown>; timestamp: string }>;
    },
  });

  const conversation = useMemo(() => {
    if (!audit) return [] as Array<{ role: string; text: string; ts: string }>;
    return audit
      .filter(e => ['TICKET_CREATED','REPLY_SENT','AUTO_CLOSED','ASSIGNED_TO_HUMAN'].includes(e.action))
      .map(e => {
        if (e.action === 'TICKET_CREATED') {
          return { role: 'user', text: 'Ticket created', ts: e.timestamp };
        }
        if (e.action === 'REPLY_SENT') {
          const text = typeof e.meta?.message === 'string' ? String(e.meta?.message) : 'Agent replied';
          return { role: 'agent', text, ts: e.timestamp };
        }
        if (e.action === 'AUTO_CLOSED') {
          return { role: 'system', text: 'Ticket auto-closed with suggested reply', ts: e.timestamp };
        }
        if (e.action === 'ASSIGNED_TO_HUMAN') {
          return { role: 'system', text: 'Assigned to human agent', ts: e.timestamp };
        }
        return { role: e.actor, text: e.action, ts: e.timestamp };
      });
  }, [audit]);

  const sendReply = useMutation({
    mutationFn: async () => {
      await api.post(endpoints.tickets.reply(id!), { message: reply });
    },
    onSuccess: async () => {
      setReply('');
      await qc.invalidateQueries({ queryKey: ['audit', id] });
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Ticket #{id}</h1>
      {isLoading && (
        <div className="mt-6">
          <Skeleton className="h-6 w-1/3 mb-4" />
          <SkeletonText lines={5} />
        </div>
      )}
      {ticket && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm text-gray-500 mb-2 capitalize">{ticket.category} • {ticket.status}</div>
              <h2 className="text-xl font-semibold">{ticket.title}</h2>
              <p className="mt-3 text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="font-semibold mb-2">Agent Suggestion</h3>
              {suggestion ? (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Predicted: {suggestion.predictedCategory} • Confidence: {(suggestion.confidence * 100).toFixed(0)}%</div>
                  <div className="whitespace-pre-wrap">{suggestion.draftReply}</div>
                </div>
              ) : (
                <div className="text-gray-500">No suggestion yet.</div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="font-semibold mb-2">Audit Timeline</h3>
              <div className="space-y-2">
                {audit?.map((e, idx) => (
                  <div key={idx} className="text-sm text-gray-700 flex items-center justify-between">
                    <span>{e.action}</span>
                    <span className="text-gray-400">{new Date(e.timestamp).toLocaleString()}</span>
                  </div>
                ))}
                {!audit?.length && <div className="text-gray-500">No events</div>}
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="font-semibold mb-2">Conversation</h3>
              <div className="space-y-4">
                {conversation.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : m.role === 'agent' ? 'justify-end' : 'justify-center'}`}>
                    <div className={`max-w-xl rounded px-3 py-2 text-sm ${m.role === 'agent' ? 'bg-blue-600 text-white' : m.role === 'user' ? 'bg-gray-100 text-gray-900' : 'bg-yellow-50 text-yellow-800'}`}>
                      <div className="font-medium mb-1 capitalize">{m.role}</div>
                      <div className="whitespace-pre-wrap">{m.text}</div>
                      <div className="mt-1 text-xs opacity-75">{new Date(m.ts).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
                {!conversation.length && <div className="text-gray-500">No messages yet</div>}
              </div>
              {(user?.role === 'agent' || user?.role === 'admin') && (
                <form onSubmit={(e) => { e.preventDefault(); void sendReply.mutateAsync(); }} className="mt-4 flex gap-2">
                  <input aria-label="Reply message" className="flex-1 border rounded px-3 py-2" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a reply" required />
                  <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50" disabled={sendReply.isPending}>Send</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetail;

