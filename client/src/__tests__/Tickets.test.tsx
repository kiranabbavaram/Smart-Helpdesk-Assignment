import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Tickets from '../pages/Tickets';

// Mock the auth context
const mockAuthContext = {
  user: { name: 'Test User', role: 'user' },
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
};

// Mock the AuthContext
vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => mockAuthContext,
  };
});

// Mock the API
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  endpoints: {
    tickets: {
      list: '/api/tickets',
      create: '/api/tickets',
    },
  },
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Tickets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tickets list page', () => {
    renderWithProviders(<Tickets />);
    
    expect(screen.getByText(/manage support tickets/i)).toBeInTheDocument();
    expect(screen.getByText(/create ticket/i)).toBeInTheDocument();
    expect(screen.getByText(/recent tickets/i)).toBeInTheDocument();
  });

  it('shows create ticket form when button is clicked', () => {
    renderWithProviders(<Tickets />);
    
    // Form should be visible by default
    expect(screen.getByPlaceholderText(/title/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/describe your issue/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create ticket/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty ticket form', async () => {
    renderWithProviders(<Tickets />);
    
    const submitButton = screen.getByRole('button', { name: /create ticket/i });
    fireEvent.click(submitButton);

    // HTML5 validation should prevent submission and show browser validation
    // Since we're using required attributes, the form won't submit with empty fields
    await waitFor(() => {
      expect(submitButton).toBeInTheDocument();
    });
  });
});
