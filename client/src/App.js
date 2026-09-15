import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import { authService } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendHealth, setBackendHealth] = useState(null);

  useEffect(() => {
    async function initAuth() {
      // 1. Check backend status
      try {
        const health = await authService.checkHealth();
        setBackendHealth(health);
      } catch {
        setBackendHealth({ status: 'down', message: 'Backend unreachable' });
      }

      // 2. Validate current session if token is saved
      const storedToken = authService.getToken();
      if (storedToken) {
        try {
          const profile = await authService.getProfile();
          if (profile) {
            setUser(profile);
          } else {
            // Fallback to locally cached user info if profile call failed but token exists
            const localUser = authService.getUser();
            if (localUser) setUser(localUser);
          }
        } catch {
          const localUser = authService.getUser();
          if (localUser) setUser(localUser);
        }
      }

      setLoading(false);
    }

    initAuth();
  }, []);

  const handleLoginSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        backgroundColor: '#07090e',
        color: '#94a3b8',
      }}>
        <div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }} />
        <p style={{ fontSize: '14px', fontWeight: 500 }}>Connecting to Finly Secure Gateway...</p>
      </div>
    );
  }

  return (
    <>
      {user ? (
        <Dashboard
          user={user}
          onLogout={handleLogout}
          backendHealth={backendHealth}
        />
      ) : (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          backendHealth={backendHealth}
        />
      )}
    </>
  );
}

export default App;
