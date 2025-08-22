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

// Add request interceptor for debugging (only in development)
if (import.meta.env.DEV) {
  api.interceptors.request.use(
    (config) => {
      // Only log auth-related requests to reduce noise
      if (config.url?.includes('/auth/')) {
        console.log('Auth Request:', config.method?.toUpperCase(), config.url);
      }
      return config;
    },
    (error) => {
      console.error('API Request Error:', error);
      return Promise.reject(error);
    }
  );
}

// Add response interceptor for debugging (only in development)
if (import.meta.env.DEV) {
  api.interceptors.response.use(
    (response) => {
      // Only log auth-related responses to reduce noise
      if (response.config.url?.includes('/auth/')) {
        console.log('Auth Response:', response.status, response.config.url);
      }
      return response;
    },
    async (error) => {
      // Only log auth-related errors to reduce noise
      if (error.config?.url?.includes('/auth/')) {
        console.error('Auth Error:', error.response?.status, error.config.url);
      }
      
      // Handle 401 errors by attempting to refresh the token
      if (error.response?.status === 401 && error.config?.url !== '/auth/refresh') {
        console.log('Attempting to refresh token...');
        try {
          // Try to refresh the token
          await api.post('/auth/refresh');
          console.log('Token refreshed, retrying original request...');
          
          // Retry the original request
          const originalRequest = error.config;
          return api.request(originalRequest);
        } catch (refreshError) {
          console.log('Token refresh failed, redirecting to login...');
          // If refresh fails, clear any stored auth state
          // You might want to redirect to login here
          throw error;
        }
      }
      
      return Promise.reject(error);
    }
  );
}

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

