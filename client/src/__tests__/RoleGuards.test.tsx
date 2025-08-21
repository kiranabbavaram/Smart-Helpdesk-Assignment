import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Layout from '../components/Layout';

// Mock the auth context
const mockAuthContext: {
  user: { name: string; role: string } | null;
  login: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
  register: ReturnType<typeof vi.fn>;
} = {
  user: null,
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

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Role-based Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows admin menu items for admin users', () => {
    mockAuthContext.user = { name: 'Admin User', role: 'admin' };
    
    renderWithProviders(<Layout />);
    
    // Admin should see all menu items including Settings
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/tickets/i)).toBeInTheDocument();
    expect(screen.getByText(/knowledge base/i)).toBeInTheDocument();
    expect(screen.getByText(/settings/i)).toBeInTheDocument();
  });

  it('shows agent menu items for agent users', () => {
    mockAuthContext.user = { name: 'Agent User', role: 'agent' };
    
    renderWithProviders(<Layout />);
    
    // Agent should see standard menu items but not Settings
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/tickets/i)).toBeInTheDocument();
    expect(screen.getByText(/knowledge base/i)).toBeInTheDocument();
    expect(screen.queryByText(/settings/i)).not.toBeInTheDocument();
  });

  it('hides admin menu items for regular users', () => {
    mockAuthContext.user = { name: 'Regular User', role: 'user' };
    
    renderWithProviders(<Layout />);
    
    // Regular users should see standard menu items but not Settings
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/tickets/i)).toBeInTheDocument();
    expect(screen.getByText(/knowledge base/i)).toBeInTheDocument();
    expect(screen.queryByText(/settings/i)).not.toBeInTheDocument();
  });
});
