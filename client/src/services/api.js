// API Service for Finly Authentication & Backend Communication
const API_BASE = (typeof window !== 'undefined' && window.location.port !== '5001')
  ? 'http://localhost:5001/api'
  : '/api';

export const authService = {
  // Store authentication data across both legacy and React keys
  saveAuth(token, user) {
    localStorage.setItem('finly_auth_token', token);
    localStorage.setItem('finly_token', token);
    localStorage.setItem('finly_user', JSON.stringify(user));
  },

  // Retrieve stored token
  getToken() {
    return localStorage.getItem('finly_auth_token') || localStorage.getItem('finly_token') || '';
  },

  // Retrieve stored user object
  getUser() {
    const raw = localStorage.getItem('finly_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // Clear session on logout
  logout() {
    localStorage.removeItem('finly_auth_token');
    localStorage.removeItem('finly_token');
    localStorage.removeItem('finly_user');
  },

  // Register new user
  async register({ name, email, password }) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    if (data.token && data.user) {
      this.saveAuth(data.token, data.user);
    }
    return data;
  },

  // Login existing user
  async login({ email, password }) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    if (data.token && data.user) {
      this.saveAuth(data.token, data.user);
    }
    return data;
  },

  // Get current authenticated user profile
  async getProfile() {
    const token = this.getToken();
    if (!token) return null;

    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      this.logout();
      return null;
    }

    const data = await response.json();
    return data.user;
  },

  // Health check for backend and database status
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) return { status: 'down', connected: false };
      const data = await res.json();
      return {
        ...data,
        connected: true,
      };
    } catch {
      return { status: 'down', connected: false, message: 'Backend unreachable' };
    }
  },
};
