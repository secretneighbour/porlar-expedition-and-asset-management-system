import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AuthLoginResponse, PolarUser } from '../types';
import { apiFetch, checkBackendConnection, getApiBaseUrl } from '../utils/api';

interface PolarLoginViewProps {
  onLoginSuccess: (user: PolarUser, dashboardRoute: string, remember: boolean) => void;
}

export function PolarLoginView({ onLoginSuccess }: PolarLoginViewProps) {
  const [selectedRole, setSelectedRole] = useState<'researcher' | 'asset' | 'transport'>('researcher');
  const [userId, setUserId] = useState('RSC-0142');
  const [password, setPassword] = useState('polar2026');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error' | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Backend connection & database diagnostics
  const [backendHealth, setBackendHealth] = useState<{
    online: boolean;
    statusText: string;
    databaseStatus?: string;
    usersCount?: number;
    origin: string;
  } | null>(null);

  const verifyBackend = useCallback(async () => {
    const health = await checkBackendConnection();
    setBackendHealth(health);
  }, []);

  useEffect(() => {
    verifyBackend();
    const interval = setInterval(verifyBackend, 10000);
    return () => clearInterval(interval);
  }, [verifyBackend]);

  // Attribution integrity check preserved from polar-login.html
  const attributionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const footerLink = document.querySelector('#attribution-line a[href*="wondermayank.in"]');
    const creditIntact =
      !!footerLink &&
      /wondermayank\.in/i.test(footerLink.getAttribute('href') || '') &&
      /wondermayank\.in/i.test(footerLink.textContent || '');

    if (!creditIntact) {
      const overlay = document.createElement('div');
      overlay.id = 'attribution-integrity-overlay';
      overlay.style.cssText =
        'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(20,10,40,0.6);backdrop-filter:blur(4px);font-family:Inter,sans-serif;';
      overlay.innerHTML =
        '<div style="background:#fff;border-radius:20px;padding:28px 30px;max-width:380px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,0.4);border:1px solid #C4B5FD;">' +
        '<h4 style="font-family:\'Space Grotesk\',sans-serif;color:#372F5C;margin-bottom:10px;font-size:18px;">Attribution removed</h4>' +
        '<p style="color:#6B6485;font-size:14px;margin-bottom:16px;">This login screen was built by wondermayank.in and is free to use only with the credit left in the footer.</p>' +
        '<a href="https://wondermayank.in" target="_blank" rel="noopener" style="display:inline-block;padding:10px 20px;border-radius:12px;color:#fff;text-decoration:none;font-weight:600;font-size:14px;background:linear-gradient(135deg,#7C3AED,#60A5FA);">Restore credit / get a license</a>' +
        '</div>';
      document.body.appendChild(overlay);
    }
  }, []);

  // Update default demo ID when switching roles if default demo credentials are still present
  const handleRoleChange = (role: 'researcher' | 'asset' | 'transport') => {
    setSelectedRole(role);
    if (userId === 'RSC-0142' || userId === 'AST-0101' || userId === 'TRN-0301') {
      if (role === 'researcher') setUserId('RSC-0142');
      else if (role === 'asset') setUserId('AST-0101');
      else if (role === 'transport') setUserId('TRN-0301');
    }
    // Clear any previous error when user actively selects a role
    if (statusType === 'error') {
      setStatusText('');
      setStatusType(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId.trim()) {
      setStatusText('Please enter your User ID.');
      setStatusType('error');
      return;
    }

    if (!password) {
      setStatusText('Please enter your password.');
      setStatusType('error');
      return;
    }

    setLoading(true);
    setStatusText('Verifying credentials with Polar Operations Server…');
    setStatusType('info');

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          role: selectedRole,
          userId: userId.trim(),
          password,
          remember,
        }),
      });

      let data: AuthLoginResponse;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error('Backend returned an invalid non-JSON response. Check network proxy or server logs.');
      }

      if (response.ok && data.ok && data.user) {
        setStatusText(`Authenticated as ${data.user.role} — routing to operations console…`);
        setStatusType('success');

        // Persist session token for authenticated REST & WebSocket communication
        if (data.token) {
          try {
            sessionStorage.setItem('polar_auth_token', data.token);
            if (remember) {
              localStorage.setItem('polar_auth_token', data.token);
            }
          } catch {}
        }

        setTimeout(() => {
          onLoginSuccess(
            {
              id: data.user!.id,
              name: data.user!.name,
              role: data.user!.role,
              email: data.user!.email,
              active: true,
            },
            data.dashboardRoute || 'dashboard',
            remember
          );
        }, 350);
      } else {
        setStatusText(data.error || 'Authentication rejected. Verify your credentials.');
        setStatusType('error');
      }
    } catch (err: any) {
      console.error('[PolarLoginView] Backend authentication failure:', err.message);
      const targetOrigin = getApiBaseUrl() || (typeof window !== 'undefined' ? window.location.origin : 'server');
      setStatusText(`Connection failed: Unable to reach Polar Operations Backend at ${targetOrigin}. Verify server is running on port 3000 and shared database is reachable.`);
      setStatusType('error');
      verifyBackend();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        fontFamily: "'Inter', sans-serif",
        color: '#F5F3FF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: `
          radial-gradient(circle at 10% 15%, rgba(167,139,250,0.30), transparent 45%),
          radial-gradient(circle at 90% 10%, rgba(96,165,250,0.20), transparent 40%),
          radial-gradient(circle at 50% 90%, rgba(196,181,253,0.18), transparent 45%),
          linear-gradient(160deg, #2E1065 0%, #1E1240 55%, #150B2E 100%)
        `,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '26px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
          padding: '34px 30px 26px',
          boxSizing: 'border-box',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 700,
            fontSize: '17px',
            marginBottom: '22px',
            fontFamily: "'Space Grotesk', sans-serif",
            color: '#F5F3FF',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '28px', height: '28px', flexShrink: 0 }}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#60A5FA" />
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="11" stroke="url(#logoGrad)" strokeWidth="1.6" />
            <path
              d="M12 2v20M2 12h20M4.5 4.5l15 15M19.5 4.5l-15 15"
              stroke="url(#logoGrad)"
              strokeWidth="1.1"
              opacity="0.6"
            />
            <circle cx="12" cy="12" r="3.2" fill="url(#logoGrad)" />
          </svg>
          <span>Polar Ops Console</span>
        </div>

        {/* Title & Subtitle */}
        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '6px',
            color: '#F5F3FF',
            letterSpacing: '-0.02em',
          }}
        >
          Sign in
        </h1>
        <div
          style={{
            fontSize: '13.5px',
            color: '#C9C1E8',
            marginBottom: '16px',
            lineHeight: 1.4,
          }}
        >
          Select your role and enter your credentials to continue.
        </div>

        {/* Backend & Shared Database Diagnostics Status Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 12px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '11.5px',
            backgroundColor: backendHealth?.online ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.14)',
            border: `1px solid ${backendHealth?.online ? 'rgba(16, 185, 129, 0.28)' : 'rgba(239, 68, 68, 0.32)'}`,
            color: backendHealth?.online ? '#A7F3D0' : '#FECACA',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: backendHealth?.online ? '#10B981' : '#EF4444',
                boxShadow: backendHealth?.online ? '0 0 8px #10B981' : '0 0 8px #EF4444',
              }}
            />
            <span>
              {backendHealth?.online
                ? `Shared Server: ONLINE • DB: CONNECTED (${backendHealth.usersCount || 0} users)`
                : `Shared Server: ${backendHealth?.statusText || 'CONNECTING…'}`}
            </span>
          </div>
          <button
            type="button"
            onClick={verifyBackend}
            style={{
              background: 'none',
              border: 'none',
              color: backendHealth?.online ? '#6EE7B7' : '#FCA5A5',
              cursor: 'pointer',
              fontSize: '11px',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Check
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Access Role Selection */}
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#C9C1E8',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '10px',
            }}
          >
            Access role
          </div>

          <div
            id="role-group"
            role="radiogroup"
            aria-label="Access role"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              marginBottom: '24px',
            }}
          >
            {/* Role 1: Researcher */}
            <label
              onClick={() => handleRoleChange('researcher')}
              style={{
                cursor: 'pointer',
                textAlign: 'center',
                padding: '14px 6px 12px',
                borderRadius: '16px',
                background:
                  selectedRole === 'researcher'
                    ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.28), rgba(96, 165, 250, 0.20))'
                    : 'rgba(255, 255, 255, 0.04)',
                border:
                  selectedRole === 'researcher'
                    ? '1px solid #C4B5FD'
                    : '1px solid rgba(196, 181, 253, 0.18)',
                transition: 'border-color 0.15s, background 0.15s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="role-card"
            >
              <input
                type="radio"
                name="role"
                value="researcher"
                checked={selectedRole === 'researcher'}
                onChange={() => handleRoleChange('researcher')}
                style={{ display: 'none' }}
                aria-label="Researcher"
              />
              <svg
                viewBox="0 0 24 24"
                fill="none"
                style={{ width: '22px', height: '22px', marginBottom: '6px' }}
                aria-hidden="true"
              >
                <path d="M9 3h6l1 4H8l1-4Z" stroke="#C4B5FD" strokeWidth="1.5" />
                <path
                  d="M8 7l-3 12a2 2 0 0 0 2 2.4h10a2 2 0 0 0 2-2.4L16 7"
                  stroke="#C4B5FD"
                  strokeWidth="1.5"
                />
                <circle cx="12" cy="15" r="2.2" stroke="#60A5FA" strokeWidth="1.4" />
              </svg>
              <div
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: selectedRole === 'researcher' ? '#fff' : '#C9C1E8',
                  lineHeight: 1.25,
                }}
              >
                Researcher
              </div>
            </label>

            {/* Role 2: Asset Management */}
            <label
              onClick={() => handleRoleChange('asset')}
              style={{
                cursor: 'pointer',
                textAlign: 'center',
                padding: '14px 6px 12px',
                borderRadius: '16px',
                background:
                  selectedRole === 'asset'
                    ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.28), rgba(96, 165, 250, 0.20))'
                    : 'rgba(255, 255, 255, 0.04)',
                border:
                  selectedRole === 'asset'
                    ? '1px solid #C4B5FD'
                    : '1px solid rgba(196, 181, 253, 0.18)',
                transition: 'border-color 0.15s, background 0.15s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="role-card"
            >
              <input
                type="radio"
                name="role"
                value="asset"
                checked={selectedRole === 'asset'}
                onChange={() => handleRoleChange('asset')}
                style={{ display: 'none' }}
                aria-label="Asset Management"
              />
              <svg
                viewBox="0 0 24 24"
                fill="none"
                style={{ width: '22px', height: '22px', marginBottom: '6px' }}
                aria-hidden="true"
              >
                <rect x="3" y="9" width="14" height="8" rx="2" stroke="#C4B5FD" strokeWidth="1.5" />
                <circle cx="7" cy="19" r="1.6" fill="#60A5FA" />
                <circle cx="14" cy="19" r="1.6" fill="#60A5FA" />
                <path d="M17 12h3l1 4h-4" stroke="#C4B5FD" strokeWidth="1.5" />
              </svg>
              <div
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: selectedRole === 'asset' ? '#fff' : '#C9C1E8',
                  lineHeight: 1.25,
                }}
              >
                Asset<br />Management
              </div>
            </label>

            {/* Role 3: Transportation */}
            <label
              onClick={() => handleRoleChange('transport')}
              style={{
                cursor: 'pointer',
                textAlign: 'center',
                padding: '14px 6px 12px',
                borderRadius: '16px',
                background:
                  selectedRole === 'transport'
                    ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.28), rgba(96, 165, 250, 0.20))'
                    : 'rgba(255, 255, 255, 0.04)',
                border:
                  selectedRole === 'transport'
                    ? '1px solid #C4B5FD'
                    : '1px solid rgba(196, 181, 253, 0.18)',
                transition: 'border-color 0.15s, background 0.15s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="role-card"
            >
              <input
                type="radio"
                name="role"
                value="transport"
                checked={selectedRole === 'transport'}
                onChange={() => handleRoleChange('transport')}
                style={{ display: 'none' }}
                aria-label="Transportation"
              />
              <svg
                viewBox="0 0 24 24"
                fill="none"
                style={{ width: '22px', height: '22px', marginBottom: '6px' }}
                aria-hidden="true"
              >
                <path
                  d="M4 18l5-10 4 6 3-4 4 8"
                  stroke="#C4B5FD"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="18" cy="6" r="2" stroke="#60A5FA" strokeWidth="1.4" />
              </svg>
              <div
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: selectedRole === 'transport' ? '#fff' : '#C9C1E8',
                  lineHeight: 1.25,
                }}
              >
                Transportation
              </div>
            </label>
          </div>

          {/* User ID Field */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="uid"
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#C9C1E8',
                marginBottom: '7px',
              }}
            >
              User ID
            </label>
            <div style={{ position: 'relative' }}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  opacity: 0.7,
                  pointerEvents: 'none',
                }}
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="3.4" stroke="#C4B5FD" strokeWidth="1.5" />
                <path
                  d="M4.5 20c1.4-3.6 4.4-5.6 7.5-5.6s6.1 2 7.5 5.6"
                  stroke="#C4B5FD"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <input
                type="text"
                id="uid"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g. RSC-0142"
                autoComplete="username"
                disabled={loading}
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 14px 12px 40px',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(196, 181, 253, 0.22)',
                  color: '#F5F3FF',
                  outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#C4B5FD';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.22)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(196, 181, 253, 0.22)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="pwd"
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#C9C1E8',
                marginBottom: '7px',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  opacity: 0.7,
                  pointerEvents: 'none',
                }}
                aria-hidden="true"
              >
                <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="#C4B5FD" strokeWidth="1.5" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#C4B5FD" strokeWidth="1.5" />
              </svg>
              <input
                type="password"
                id="pwd"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 14px 12px 40px',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(196, 181, 253, 0.22)',
                  color: '#F5F3FF',
                  outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#C4B5FD';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.22)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(196, 181, 253, 0.22)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Remember Device & Forgot Password */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              margin: '2px 0 22px',
              fontSize: '12.5px',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                color: '#C9C1E8',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{
                  accentColor: '#7C3AED',
                  width: '14px',
                  height: '14px',
                  cursor: 'pointer',
                }}
              />
              <span>Remember this device</span>
            </label>

            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              style={{
                color: '#C4B5FD',
                textDecoration: 'none',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontSize: '12.5px',
                fontFamily: 'inherit',
              }}
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '16px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: 700,
              color: '#fff',
              fontFamily: "'Inter', sans-serif",
              background: 'linear-gradient(135deg, #7C3AED, #60A5FA)',
              boxShadow: '0 14px 30px rgba(124, 58, 237, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'opacity 0.2s, transform 0.1s',
              opacity: loading ? 0.8 : 1,
            }}
            className="signin-btn"
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M9 12h11M16 7l4 5-4 5"
                    stroke="#fff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7"
                    stroke="#fff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Sign in</span>
              </>
            )}
          </button>

          {/* Live Status Feedback Banner */}
          <div
            id="status"
            role="status"
            aria-live="polite"
            style={{
              fontSize: '12.5px',
              textAlign: 'center',
              marginTop: '14px',
              minHeight: '16px',
              color:
                statusType === 'success'
                  ? '#5EEAB0'
                  : statusType === 'error'
                  ? '#FDA4AF'
                  : '#C9C1E8',
              fontWeight: statusType === 'success' ? 600 : 500,
              transition: 'color 0.2s',
            }}
          >
            {statusText}
          </div>
        </form>

        {/* Footer with Preserved Attribution */}
        <footer style={{ marginTop: '26px', textAlign: 'center' }}>
          <div
            ref={attributionRef}
            className="footer-line"
            id="attribution-line"
            style={{
              fontSize: '12px',
              color: '#C9C1E8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              flexWrap: 'wrap',
            }}
          >
            Powered by{' '}
            <a
              href="https://wondermayank.in"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#C4B5FD',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              wondermayank.in
            </a>
          </div>
        </footer>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-pwd-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(10, 5, 25, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowForgotModal(false)}
        >
          <div
            style={{
              background: '#1E1240',
              border: '1px solid rgba(196, 181, 253, 0.3)',
              borderRadius: '20px',
              maxWidth: '400px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              color: '#F5F3FF',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'rgba(124, 58, 237, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#C4B5FD',
                }}
              >
                🔒
              </div>
              <h3
                id="forgot-pwd-title"
                style={{
                  margin: 0,
                  fontSize: '17px',
                  fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                Polar Credentials Recovery
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: '#C9C1E8', lineHeight: 1.5, marginBottom: '16px' }}>
              In sub-zero Antarctic and Arctic field operations, self-service email recovery is restricted to prevent unauthorized station terminal takeover.
            </p>

            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(196,181,253,0.15)',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '12px',
                marginBottom: '16px',
                fontFamily: 'monospace',
              }}
            >
              <div style={{ color: '#60A5FA', fontWeight: 600, marginBottom: '4px' }}>
                Default Demonstration Passwords:
              </div>
              <div style={{ color: '#C9C1E8' }}>Password: <strong style={{ color: '#fff' }}>polar2026</strong></div>
              <div style={{ color: '#C9C1E8' }}>Researcher: <strong style={{ color: '#fff' }}>RSC-0142</strong></div>
              <div style={{ color: '#C9C1E8' }}>Asset Mgr: <strong style={{ color: '#fff' }}>AST-0101</strong></div>
              <div style={{ color: '#C9C1E8' }}>Transport: <strong style={{ color: '#fff' }}>TRN-0301</strong></div>
            </div>

            <p style={{ fontSize: '12px', color: '#A78BFA', marginBottom: '18px' }}>
              For live field deployments, contact your Base Station Communications Officer via Iridium VHF SATCOM Channel 16.
            </p>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #7C3AED, #60A5FA)',
                color: '#fff',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Global CSS spinner keyframe animation if not already present */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .role-card:focus-visible {
          outline: 2px solid #C4B5FD;
          outline-offset: 2px;
        }
        .signin-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 16px 35px rgba(124, 58, 237, 0.5);
        }
      `}</style>
    </div>
  );
}
