import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Wallet, 
  CheckCircle2, 
  AlertCircle,
  Database
} from 'lucide-react';
import { authService } from '../services/api';

export default function LoginPage({ onLoginSuccess, backendHealth }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const redirectToDashboard = (userData) => {
    if (onLoginSuccess) {
      onLoginSuccess(userData);
    }
    // Directly redirect to the main Finly dashboard
    setTimeout(() => {
      window.location.href = 'http://localhost:5001/';
    }, 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!formData.name.trim()) {
          throw new Error('Please enter your full name');
        }
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        const data = await authService.register({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        });

        setSuccess('Account created! Taking you directly to Finly...');
        redirectToDashboard(data.user);
      } else {
        const data = await authService.login({
          email: formData.email.trim(),
          password: formData.password,
        });

        setSuccess('Login successful! Taking you directly to Finly...');
        redirectToDashboard(data.user);
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to backend on port 5001. Please ensure node server.js is running.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = (registerMode) => {
    setIsRegister(registerMode);
    setError('');
    setSuccess('');
  };

  const isBackendUp = backendHealth?.status === 'ok' || backendHealth?.connected === true;
  const isMongoConnected = backendHealth?.database === 'connected';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      backgroundColor: 'var(--bg-main)',
    }}>
      <div className="finly-card" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '32px 28px',
      }}>
        {/* Finly Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div className="brand-logo-box">
            <Wallet size={18} />
          </div>
          <div>
            <h1 style={{
              fontSize: '17px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              margin: 0,
            }}>
              Finly
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              {isRegister ? 'Create your Finly account' : 'Sign in to access your finances'}
            </p>
          </div>
        </div>

        {/* Segmented Switcher Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          backgroundColor: '#0c0d11',
          padding: '3px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          marginBottom: '20px',
        }}>
          <button
            type="button"
            onClick={() => toggleMode(false)}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: !isRegister ? 'var(--text-primary)' : 'var(--text-muted)',
              backgroundColor: !isRegister ? 'var(--surface-hover)' : 'transparent',
              border: !isRegister ? '1px solid var(--border)' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => toggleMode(true)}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: isRegister ? 'var(--text-primary)' : 'var(--text-muted)',
              backgroundColor: isRegister ? 'var(--surface-hover)' : 'transparent',
              border: isRegister ? '1px solid var(--border)' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Alert Feedback */}
        {error && (
          <div className="alert-banner alert-error">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert-banner alert-success">
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="form-input-container">
                <User size={16} className="form-input-icon" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Pratham Sawant"
                  required={isRegister}
                  className="form-input"
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="form-input-container">
              <Mail size={16} className="form-input-icon" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="name@example.com"
                required
                className="form-input"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
              {!isRegister && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Min 6 characters
                </span>
              )}
            </div>
            <div className="form-input-container">
              <Lock size={16} className="form-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
                minLength={6}
                className="form-input"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className="form-input-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: '6px' }}
          >
            {loading ? (
              <div className="spinner" />
            ) : (
              <>
                <span>{isRegister ? 'Create Account & Open Finly' : 'Sign In & Open Finly'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div style={{
          marginTop: '16px',
          padding: '10px 12px',
          borderRadius: '8px',
          backgroundColor: '#0e1017',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>Quick Test Credentials</p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>user@finly.com • pass123</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFormData({ name: 'Pratham Sawant', email: 'user@finly.com', password: 'password123' });
            }}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--text-accent)',
              backgroundColor: 'var(--bg-accent)',
              border: '1px solid var(--bg-accent-border)',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Auto-fill
          </button>
        </div>

        {/* Footer Mode Switch */}
        <p style={{
          textAlign: 'center',
          fontSize: '12.5px',
          color: 'var(--text-secondary)',
          marginTop: '18px',
        }}>
          {isRegister ? 'Already registered?' : "Don't have an account yet?"}{' '}
          <button
            type="button"
            onClick={() => toggleMode(!isRegister)}
            style={{
              background: 'transparent',
              color: 'var(--text-accent)',
              fontWeight: 550,
              fontSize: '12.5px',
              border: 'none',
              cursor: 'pointer',
              padding: '0 2px',
            }}
          >
            {isRegister ? 'Sign in' : 'Create account'}
          </button>
        </p>

        {/* Backend & Storage Status Indicator */}
        <div style={{
          marginTop: '20px',
          paddingTop: '14px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--text-muted)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: isBackendUp ? 'var(--text-success)' : 'var(--text-danger)',
              display: 'inline-block',
            }} />
            <span>Backend: {isBackendUp ? 'Connected (Port 5001)' : 'Offline'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={12} color={isMongoConnected ? 'var(--text-success)' : 'var(--text-warning)'} />
            <span style={{ color: isMongoConnected ? 'var(--text-success)' : 'var(--text-warning)' }}>
              {isMongoConnected ? 'MongoDB' : 'In-Memory Store'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
