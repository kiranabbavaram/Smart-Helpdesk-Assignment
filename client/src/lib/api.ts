import axios from 'axios';

// Create axios instance with base configuration
export const api = axios.create({
  // Use Vite dev proxy by default; allow overriding via VITE_API_URL in production
  baseURL: (import.meta.env.VITE_API_URL as string | undefined) || '/api',
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// No request token injection; rely on HttpOnly cookies

// No global 401 redirect to avoid reload loops; route guards handle auth state

// API endpoints
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    me: '/auth/me',
  },
  tickets: {
    list: '/tickets',
    create: '/tickets',
    get: (id: string) => `/tickets/${id}`,
    reply: (id: string) => `/tickets/${id}/reply`,
    assign: (id: string) => `/tickets/${id}/assign`,
  },
  kb: {
    search: '/kb',
    create: '/kb',
    update: (id: string) => `/kb/${id}`,
    delete: (id: string) => `/kb/${id}`,
  },
  agent: {
    triage: '/agent/triage',
    suggestion: (id: string) => `/agent/suggestion/${id}`,
  },
  config: {
    get: '/config',
    update: '/config',
  },
  audit: {
    ticketAudit: (id: string) => `/tickets/${id}/audit`,
  },
};

