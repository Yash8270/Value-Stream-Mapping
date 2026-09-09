import React, { useState } from 'react';
import { Lock, Mail, User as UserIcon, Activity, ArrowRight, Loader2, AlertCircle, ShieldCheck, Layers, Sparkles, AlertTriangle } from 'lucide-react';
import { useVSM } from '../../context/Context';

export default function AuthPage() {
  const { login, loginWithGoogle, register, loading, error, clearError } = useVSM();
  const [isRegister, setIsRegister] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleClientIdNotice, setGoogleClientIdNotice] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const isRealClientIdConfigured = clientId && 
    !clientId.includes('YOUR_GOOGLE_CLIENT_ID') && 
    !clientId.includes('dummyclientid');

  // Handle Google OAuth Popup
  const handleGoogleOAuthPopup = async () => {
    clearError();
    setGoogleClientIdNotice(false);

    // If Client ID is not configured in .env yet, display notice and allow 1-click test login as yashlimbachiya900@gmail.com
    if (!isRealClientIdConfigured) {
      setGoogleClientIdNotice(true);
      return;
    }

    setGoogleLoading(true);

    // 1. Try Google Identity Services OAuth Token Client
    if (window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: async (tokenResponse) => {
            if (tokenResponse.access_token) {
              try {
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await userInfoRes.json();

                if (userInfo.email) {
                  await loginWithGoogle({
                    email: userInfo.email,
                    name: userInfo.name || userInfo.given_name || 'Google User',
                    token: tokenResponse.access_token,
                    google_id: userInfo.sub,
                  });
                }
              } catch (err) {
                console.error("Google userinfo error:", err);
              } finally {
                setGoogleLoading(false);
              }
            } else {
              setGoogleLoading(false);
            }
          },
          error_callback: () => setGoogleLoading(false)
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.error("Google TokenClient notice:", err);
      }
    }

    // 2. Direct Window Open Popup to accounts.google.com
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const redirectUri = window.location.origin;
    const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent('https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email')}` +
      `&prompt=select_account`;

    const popup = window.open(
      googleOAuthUrl,
      'GoogleSignInPopup',
      `width=${width},height=${height},top=${top},left=${left},status=no,toolbar=no,menubar=no`
    );

    if (!popup) {
      alert("Popup blocked by browser! Please allow popups for this site.");
      setGoogleLoading(false);
      return;
    }

    const timer = setInterval(async () => {
      try {
        if (popup.closed) {
          clearInterval(timer);
          setGoogleLoading(false);
          return;
        }

        if (popup.location?.href?.includes('access_token')) {
          const hash = popup.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          popup.close();
          clearInterval(timer);

          if (accessToken) {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            const userInfo = await res.json();
            if (userInfo.email) {
              await loginWithGoogle({
                email: userInfo.email,
                name: userInfo.name || userInfo.given_name,
                token: accessToken,
                google_id: userInfo.sub,
              });
            }
          }
          setGoogleLoading(false);
        }
      } catch {
        // Cross-origin polling check
      }
    }, 500);
  };

  const handleTestGoogleLogin = async (emailAddr) => {
    clearError();
    setGoogleLoading(true);
    try {
      await loginWithGoogle({
        email: emailAddr,
        name: 'Yash Limbachiya',
      });
    } catch (err) {
      console.error("Test Google login error:", err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    try {
      if (isRegister) {
        await register({ name, email, password });
      } else {
        await login({ email, password });
      }
    } catch (err) {
      console.error("Auth submit error:", err);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: 'var(--background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        maxWidth: '920px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
      }}>
        {/* Left Hero Column */}
        <div style={{
          background: 'linear-gradient(145deg, var(--vsm-navy) 0%, #0D1B2A 100%)',
          color: '#FFFFFF',
          padding: '44px 38px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            {/* Logo Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--vsm-process) 0%, var(--vsm-blue) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(22,169,216,0.4)',
              }}>
                <Activity size={22} color="#FFFFFF" />
              </div>
              <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                VSM Studio
              </span>
            </div>

            <h1 style={{ fontSize: '28px', fontWeight: 800, lineHeight: 1.25, marginBottom: '14px', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              Value Stream Mapping Platform
            </h1>

            <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#CBD5E1', marginBottom: '36px' }}>
              Sign in to access your manufacturing projects, two-level subassembly diagrams, rectangular wave timelines, and TiDB Cloud storage.
            </p>

            {/* Feature Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#E2E8F0' }}>
                <ShieldCheck size={18} color="var(--vsm-process)" />
                <span>Secure TiDB Cloud database storage & JWT auth</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#E2E8F0' }}>
                <Layers size={18} color="var(--vsm-process)" />
                <span>Interactive React Flow subassembly editor & wave timeline</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#E2E8F0' }}>
                <Sparkles size={18} color="var(--vsm-process)" />
                <span>Excel workbook parser & vector PDF export engine</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '36px' }}>
            VSM Studio Engineering Edition • Compulsory Authentication
          </div>
        </div>

        {/* Right Authentication Form Column */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
        }}>
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--vsm-navy)', marginBottom: '4px' }}>
              {isRegister ? 'Create Your Account' : 'Welcome Back'}
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--secondary-text)' }}>
              {isRegister ? 'Register to start building value stream maps' : 'Sign in using Google or email credentials'}
            </p>
          </div>

          {/* Notice when Google Client ID is not configured in .env */}
          {googleClientIdNotice && (
            <div style={{
              padding: '12px 14px', backgroundColor: '#FFFBEB', border: '1px solid #FCD34D',
              borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '12px', color: '#92400E'
            }}>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <AlertTriangle size={15} color="#D97706" /> Google Client ID Not Configured
              </div>
              <div style={{ marginBottom: '8px', lineHeight: 1.4 }}>
                To make Google pop up live on your domain, paste your Google Cloud Client ID into <code>frontend/.env</code> as <code>VITE_GOOGLE_CLIENT_ID</code>.
              </div>
              <button
                type="button"
                onClick={() => handleTestGoogleLogin('yashlimbachiya900@gmail.com')}
                style={{
                  padding: '6px 12px', background: 'var(--vsm-navy)', color: '#FFFFFF',
                  borderRadius: 'var(--radius-sm)', border: 'none', fontWeight: 600, fontSize: '11.5px',
                  cursor: 'pointer'
                }}
              >
                Sign in directly as yashlimbachiya900@gmail.com →
              </button>
            </div>
          )}

          {/* SINGLE Real Google OAuth Button */}
          <div style={{ marginBottom: '18px' }}>
            <button
              type="button"
              onClick={handleGoogleOAuthPopup}
              disabled={loading || googleLoading}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: '13.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: (loading || googleLoading) ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--shadow-xs)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                e.currentTarget.style.borderColor = 'var(--vsm-blue)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              {googleLoading ? (
                <><Loader2 size={16} className="spinning-icon" /> Opening Google Sign-In Window…</>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '18px', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
            <span style={{ fontSize: '11px', color: 'var(--secondary-text)', fontWeight: 500, textTransform: 'uppercase' }}>or with email</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
          </div>

          {/* Mode Selector Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '20px' }}>
            <button
              onClick={() => { setIsRegister(false); clearError(); }}
              style={{
                flex: 1, padding: '9px 0', fontSize: '13px', fontWeight: 700,
                color: !isRegister ? 'var(--vsm-navy)' : 'var(--secondary-text)',
                borderBottom: !isRegister ? '2px solid var(--vsm-navy)' : '2px solid transparent',
                background: 'none', borderLeft: 'none', borderRight: 'none', borderTop: 'none', cursor: 'pointer'
              }}
            >
              Sign In
            </button>

            <button
              onClick={() => { setIsRegister(true); clearError(); }}
              style={{
                flex: 1, padding: '9px 0', fontSize: '13px', fontWeight: 700,
                color: isRegister ? 'var(--vsm-navy)' : 'var(--secondary-text)',
                borderBottom: isRegister ? '2px solid var(--vsm-navy)' : '2px solid transparent',
                background: 'none', borderLeft: 'none', borderRight: 'none', borderTop: 'none', cursor: 'pointer'
              }}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                padding: '10px 12px', background: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: 'var(--radius-md)', fontSize: '12px', color: '#B91C1C',
                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'
              }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            {isRegister && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={16} color="var(--secondary-text)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Yash Limbachiya"
                    style={{ width: '100%', paddingLeft: '36px' }}
                  />
                </div>
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--secondary-text)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  style={{ width: '100%', paddingLeft: '36px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--secondary-text)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', paddingLeft: '36px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              style={{
                width: '100%', padding: '11px 16px', borderRadius: 'var(--radius-md)',
                background: 'var(--vsm-navy)', color: '#FFFFFF', fontWeight: 700, fontSize: '13.5px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                cursor: (loading || googleLoading) ? 'not-allowed' : 'pointer', border: 'none',
                boxShadow: '0 2px 6px rgba(22,50,79,0.2)'
              }}
            >
              {loading ? (
                <><Loader2 size={16} className="spinning-icon" /> Authenticating…</>
              ) : (
                <>{isRegister ? 'Create Account & Access App' : 'Sign In to Application'} <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
