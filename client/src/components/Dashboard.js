import React from 'react';
import { 
  LogOut, 
  User, 
  Mail, 
  Key, 
  TrendingUp, 
  CreditCard, 
  PieChart, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles,
  Calendar
} from 'lucide-react';
import { authService } from '../services/api';

export default function Dashboard({ user, onLogout, backendHealth }) {
  const token = authService.getToken();

  const handleLogout = () => {
    authService.logout();
    onLogout();
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formattedDate = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Today';

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      padding: '36px 20px',
      zIndex: 1,
      maxWidth: '1000px',
      margin: '0 auto',
      width: '100%',
    }}>
      {/* Decorative background lighting */}
      <div className="ambient-glow glow-1" />
      <div className="ambient-glow glow-2" />

      {/* Top Navbar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 16px rgba(99,102,241,0.4)',
          }}>
            <Sparkles size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Finly Portal
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Authenticated Financial Dashboard
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '12px',
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            color: '#fb7185',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Welcome Banner Card */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 800,
              color: '#ffffff',
              boxShadow: '0 8px 24px -4px rgba(79, 70, 229, 0.5)',
            }}>
              {getInitials(user?.name)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Welcome, {user?.name || 'Valued User'}!
                </h1>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}>
                  <ShieldCheck size={13} /> Active Session
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                You have successfully authenticated via Finly's Secure Authentication Gateway.
              </p>
            </div>
          </div>

          <a
            href="http://localhost:5001"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
            }}
          >
            <span>Open Finly Full Overview</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* Account & Session Detail Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '24px',
      }}>
        {/* Profile Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <User size={20} color="#818cf8" />
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>User Profile</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Display Name:</span>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{user?.name || 'N/A'}</p>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Registered Email:</span>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{user?.email || 'N/A'}</p>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Member Since:</span>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{formattedDate}</p>
            </div>
          </div>
        </div>

        {/* Database & Infrastructure Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Sparkles size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Database & Storage</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Storage Layer:</span>
              <p style={{
                fontWeight: 600, 
                color: backendHealth?.database?.includes('connected') ? '#34d399' : '#fbbf24',
                marginTop: '2px'
              }}>
                {backendHealth?.database ? backendHealth.database : 'Active'}
              </p>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Backend Port:</span>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>5001 (Node / Express)</p>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Authentication Protocol:</span>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>JWT (JSON Web Token) + Bcrypt</p>
            </div>
          </div>
        </div>

        {/* Security Token Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Key size={20} color="#a855f7" />
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Active JWT Token</h3>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            This cryptographically signed token is stored in localStorage to protect your session.
          </p>
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#a5b4fc',
            wordBreak: 'break-all',
            maxHeight: '70px',
            overflowY: 'auto',
          }}>
            {token || 'No active token found'}
          </div>
        </div>
      </div>

      {/* Quick Financial Overview Highlights */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#818cf8', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Net Portfolio</span>
            <TrendingUp size={18} />
          </div>
          <p style={{ fontSize: '22px', fontWeight: 800 }}>₹2,45,800</p>
          <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>+14.2% this month</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#38bdf8', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Monthly Expenses</span>
            <CreditCard size={18} />
          </div>
          <p style={{ fontSize: '22px', fontWeight: 800 }}>₹42,350</p>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Across 3 accounts</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#a855f7', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Budget Health</span>
            <PieChart size={18} />
          </div>
          <p style={{ fontSize: '22px', fontWeight: 800 }}>78% On Track</p>
          <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>Within safe limit</span>
        </div>
      </div>
    </div>
  );
}
