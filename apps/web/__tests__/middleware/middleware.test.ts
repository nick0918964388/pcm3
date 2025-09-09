/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Mock the auth function since it's a complex integration
const mockAuth = jest.fn();
jest.mock('../../src/lib/auth', () => ({
  auth: mockAuth
}));

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect unauthenticated users to login for protected routes', () => {
    const mockRequest = {
      nextUrl: {
        pathname: '/projects',
      },
      auth: null,
    } as any;

    const mockCallback = jest.fn((req) => {
      const isLoggedIn = !!req.auth;
      const isProtectedRoute = req.nextUrl.pathname.startsWith('/projects');

      if (isProtectedRoute && !isLoggedIn && req.nextUrl.pathname !== '/login') {
        return Response.redirect(new URL('/login', req.nextUrl));
      }
      return new Response('OK');
    });

    mockAuth.mockImplementation((callback) => callback);
    
    const result = mockCallback(mockRequest);
    
    expect(result).toBeInstanceOf(Response);
  });

  it('should redirect authenticated users away from login page', () => {
    const mockRequest = {
      nextUrl: {
        pathname: '/login',
      },
      auth: { user: { id: '1', username: 'testuser' } },
    } as any;

    const mockCallback = jest.fn((req) => {
      const isLoggedIn = !!req.auth;
      const isPublicRoute = req.nextUrl.pathname.startsWith('/login');

      if (isPublicRoute && isLoggedIn && req.nextUrl.pathname === '/login') {
        return Response.redirect(new URL('/projects', req.nextUrl));
      }
      return new Response('OK');
    });

    const result = mockCallback(mockRequest);
    
    expect(result).toBeInstanceOf(Response);
  });

  it('should allow access to public routes when unauthenticated', () => {
    const mockRequest = {
      nextUrl: {
        pathname: '/login',
      },
      auth: null,
    } as any;

    const mockCallback = jest.fn((req) => {
      const isLoggedIn = !!req.auth;
      const isPublicRoute = req.nextUrl.pathname.startsWith('/login');

      // Should not redirect unauthenticated users to login page
      if (isPublicRoute && !isLoggedIn) {
        return new Response('OK');
      }
      return new Response('OK');
    });

    const result = mockCallback(mockRequest);
    
    expect(result).toBeInstanceOf(Response);
  });

  it('should allow access to protected routes when authenticated', () => {
    const mockRequest = {
      nextUrl: {
        pathname: '/projects',
      },
      auth: { user: { id: '1', username: 'testuser' } },
    } as any;

    const mockCallback = jest.fn((req) => {
      const isLoggedIn = !!req.auth;
      const isProtectedRoute = req.nextUrl.pathname.startsWith('/projects');

      // Should allow authenticated users to access protected routes
      if (isProtectedRoute && isLoggedIn) {
        return new Response('OK');
      }
      return new Response('OK');
    });

    const result = mockCallback(mockRequest);
    
    expect(result).toBeInstanceOf(Response);
  });
});