'use client';

import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { FiLock, FiLogIn, FiMail, FiPhone, FiKey, FiLoader, FiUser } from 'react-icons/fi';
import { PopupToast } from '@/components';
import { SIGNUP_MUTATION } from '@/project_components/login/graphql/operations';

type LoginMethod = 'password' | 'email_otp' | 'whatsapp_otp';
type Step = 'select' | 'input' | 'verify';
type AuthMode = 'signin' | 'signup';

interface Props {
  onLogin: (method: LoginMethod, credentials: any) => Promise<{ success: boolean; message?: string; token?: string }>;
  onError: (message: string) => void;
  error?: string;
  loading?: boolean;
  /** When true, strips the full-screen dark wrapper so the molecule fits inside a modal */
  compact?: boolean;
  /** Called when user clicks back on the first step in compact mode (lets modal close) */
  onClose?: () => void;
}

export default function RouteMolecule({ onLogin, onError, error = '', loading = false, compact = false, onClose }: Props) {
  const [step, setStep] = useState<Step>('select');
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [method, setMethod] = useState<LoginMethod>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [signupMutation] = useMutation(SIGNUP_MUTATION);

  const isLoading = loading || localLoading;

  // Tailwind class helpers that differ between light (compact) and dark (full-page) modes
  const t = {
    methodBtn: compact
      ? 'w-full rounded-2xl border p-4 text-left transition-all group'
      : 'w-full p-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg transition-all group text-left',
    methodTitle: compact ? 'font-semibold' : 'font-semibold text-white',
    methodSub: compact ? 'text-sm' : 'text-sm text-slate-400',
    input: compact
      ? 'w-full rounded-2xl border py-3.5 pl-11 pr-4 text-[15px] outline-none disabled:opacity-50 transition'
      : 'w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50',
    otpInput: compact
      ? 'w-full rounded-[1.4rem] border-2 px-4 py-3.5 text-center text-2xl font-bold tracking-[0.45em] placeholder:opacity-50 outline-none disabled:opacity-50 transition'
      : 'w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-center text-2xl font-bold tracking-widest text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50',
    submitBtn: compact
      ? 'w-full rounded-2xl py-3 font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2'
      : 'w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2',
    backBtn: compact
      ? 'w-full py-1 text-sm transition-colors'
      : 'w-full text-slate-400 hover:text-white transition-colors',
    errorBox: compact
      ? 'rounded-2xl border px-4 py-3 text-sm'
      : 'text-red-400 text-sm text-center',
    successBox: compact
      ? 'rounded-2xl border px-4 py-3 text-sm'
      : 'text-emerald-400 text-sm text-center',
  };

  const compactStyles = {
    shell: {
      color: 'var(--text-primary)',
    } as React.CSSProperties,
    methodBtn: {
      borderColor: 'var(--border)',
      background: 'linear-gradient(180deg, var(--bg-surface), var(--bg-elevated))',
      color: 'var(--text-primary)',
      boxShadow: '0 16px 45px -35px rgba(15, 23, 42, 0.45)',
    } as React.CSSProperties,
    input: {
      borderColor: 'var(--border)',
      background: 'var(--bg-input)',
      color: 'var(--text-primary)',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02)',
    } as React.CSSProperties,
    fieldIcon: {
      color: 'var(--text-muted)',
    } as React.CSSProperties,
    submitBtn: {
      background: 'linear-gradient(135deg, var(--brand), var(--action))',
      boxShadow: '0 18px 50px -24px rgba(6, 182, 212, 0.55)',
    } as React.CSSProperties,
    backBtn: {
      color: 'var(--text-secondary)',
    } as React.CSSProperties,
    errorBox: {
      borderColor: 'rgba(239, 68, 68, 0.22)',
      background: 'rgba(239, 68, 68, 0.12)',
      color: 'var(--danger)',
    } as React.CSSProperties,
    successBox: {
      borderColor: 'rgba(16, 185, 129, 0.22)',
      background: 'rgba(16, 185, 129, 0.12)',
      color: 'var(--positive)',
    } as React.CSSProperties,
    tab: (active: boolean) => ({
      borderColor: active ? 'var(--brand-border)' : 'var(--border)',
      background: active ? 'var(--brand-dim)' : 'var(--bg-elevated)',
      color: active ? 'var(--brand-light)' : 'var(--text-secondary)',
    }) as React.CSSProperties,
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('');
    setLocalLoading(true);
    try {
      const result = await onLogin('password', { email, password });
      if (!result.success) {
        onError(result.message || 'Login failed');
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('');
    setLocalLoading(true);
    try {
      const result = await onLogin(method, {
        identifier: method === 'email_otp' ? email : mobileNumber,
      });
      if (result.success) {
        setStatusMessage(result.message || 'OTP sent successfully');
        setStep('verify');
      } else {
        onError(result.message || 'Failed to send OTP');
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('');
    setLocalLoading(true);
    try {
      const result = await onLogin(method, {
        identifier: method === 'email_otp' ? email : mobileNumber,
        otp,
      });
      if (!result.success) {
        onError(result.message || 'OTP verification failed');
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      onError('First name is required');
      return;
    }
    if (!email.trim() || !mobileNumber.trim()) {
      onError('Email and mobile number are required');
      return;
    }
    if (password.length < 6) {
      onError('Password must be at least 6 characters');
      return;
    }
    if (password !== passwordConfirm) {
      onError('Passwords do not match');
      return;
    }

    setStatusMessage('');
    setLocalLoading(true);
    try {
      const { data } = await signupMutation({
        variables: {
          email,
          password,
          passwordConfirm,
          mobileNumber,
          firstName,
          lastName: lastName || null,
        },
      });
      const result = (data as any)?.signup;
      if (result?.success) {
        setStatusMessage(result.message || 'Account created. Sign in to continue.');
        setAuthMode('signin');
        setMethod('password');
        setStep('input');
        onError('');
        return;
      }
      onError(result?.message || 'Signup failed');
    } finally {
      setLocalLoading(false);
    }
  };

  function renderCompactField(icon: React.ReactNode, input: React.ReactNode) {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={compactStyles.fieldIcon}>
          {icon}
        </span>
        {input}
      </div>
    );
  }

  if (step === 'select') {
    return (
      <div className={compact ? '' : 'min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4'}>
        {!compact && <PopupToast message={error || statusMessage} variant={error ? 'error' : 'success'} />}
        <div className={compact ? 'w-full' : 'w-full max-w-md'} style={compact ? compactStyles.shell : undefined}>
          {compact && (
            <div className="mb-4 flex rounded-2xl border p-1" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              <button
                type="button"
                className="flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition"
                style={compactStyles.tab(authMode === 'signin')}
                onClick={() => {
                  setAuthMode('signin');
                  setStep('select');
                  onError('');
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition"
                style={compactStyles.tab(authMode === 'signup')}
                onClick={() => {
                  setAuthMode('signup');
                  setStep('input');
                  setMethod('password');
                  onError('');
                }}
              >
                Sign up
              </button>
            </div>
          )}
          {/* Header — hidden in compact/modal mode */}
          {!compact && (
            <div className="text-center mb-8">
              <div className="inline-block p-3 bg-blue-500/20 rounded-lg mb-4">
                <FiLogIn className="text-2xl text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">HotelSphere</h1>
              <p className="text-slate-400">Choose your login method</p>
            </div>
          )}

          {/* Login Methods */}
          <div className="space-y-3">
            {/* Password Login */}
            <button
              onClick={() => {
                setAuthMode('signin');
                setMethod('password');
                setStep('input');
              }}
              className={t.methodBtn}
              style={compact ? compactStyles.methodBtn : undefined}
            >
              <div className="flex items-center gap-3">
                <FiKey className="text-xl group-hover:scale-110 transition-transform" style={{ color: 'var(--brand-light)' }} />
                <div>
                  <div className={t.methodTitle} style={compact ? { color: 'var(--text-primary)' } : undefined}>Password Login</div>
                  <div className={t.methodSub} style={compact ? { color: 'var(--text-secondary)' } : undefined}>Use your email and password</div>
                </div>
              </div>
            </button>

            {/* Email OTP */}
            <button
              onClick={() => {
                setAuthMode('signin');
                setMethod('email_otp');
                setStep('input');
              }}
              className={t.methodBtn}
              style={compact ? compactStyles.methodBtn : undefined}
            >
              <div className="flex items-center gap-3">
                <FiMail className="text-xl group-hover:scale-110 transition-transform" style={{ color: 'var(--action-light)' }} />
                <div>
                  <div className={t.methodTitle} style={compact ? { color: 'var(--text-primary)' } : undefined}>Email OTP</div>
                  <div className={t.methodSub} style={compact ? { color: 'var(--text-secondary)' } : undefined}>6-digit code sent to email</div>
                </div>
              </div>
            </button>

            {/* WhatsApp OTP */}
            <button
              onClick={() => {
                setAuthMode('signin');
                setMethod('whatsapp_otp');
                setStep('input');
              }}
              className={t.methodBtn}
              style={compact ? compactStyles.methodBtn : undefined}
            >
              <div className="flex items-center gap-3">
                <FiPhone className="text-xl text-green-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className={t.methodTitle} style={compact ? { color: 'var(--text-primary)' } : undefined}>WhatsApp OTP</div>
                  <div className={t.methodSub} style={compact ? { color: 'var(--text-secondary)' } : undefined}>6-digit code sent via WhatsApp</div>
                </div>
              </div>
            </button>
          </div>

          {error ? <p className={`mt-3 ${t.errorBox}`} style={compact ? compactStyles.errorBox : undefined}>{error}</p> : null}
          {statusMessage && compact ? <p className={`mt-3 ${t.successBox}`} style={compactStyles.successBox}>{statusMessage}</p> : null}

          {/* Footer — hidden in compact/modal mode */}
          {!compact && (
            <div className="mt-8 text-center text-sm text-slate-400">
              Don't have an account?{' '}
              <a href="/signup" className="text-blue-400 hover:text-blue-300 font-semibold">
                Sign up
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className={compact ? '' : 'min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4'}>
        {!compact && <PopupToast message={error || statusMessage} variant={error ? 'error' : 'success'} />}
        <div className={compact ? 'w-full' : 'w-full max-w-md'} style={compact ? compactStyles.shell : undefined}>
          {/* Header — hidden in compact/modal mode */}
          {!compact && (
            <div className="text-center mb-8">
              <div className="inline-block p-3 bg-blue-500/20 rounded-lg mb-4">
                <FiLock className="text-2xl text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Verify OTP</h1>
              <p className="text-slate-400">
                Enter the 6-digit code sent to {method === 'email_otp' ? email : mobileNumber}
              </p>
            </div>
          )}

          {/* OTP destination hint — compact only */}
          {compact && <p className="mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>Enter the code sent to {method === 'email_otp' ? email : mobileNumber}</p>}

          {statusMessage ? <p className={`mb-3 ${t.successBox}`} style={compact ? compactStyles.successBox : undefined}>{statusMessage}</p> : null}
          {error ? <p className={`mb-3 ${t.errorBox}`} style={compact ? compactStyles.errorBox : undefined}>{error}</p> : null}

          {/* OTP Verification Form */}
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              disabled={isLoading}
              required
              autoFocus
              className={t.otpInput}
              style={compact ? compactStyles.input : undefined}
            />

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className={t.submitBtn}
              style={compact ? compactStyles.submitBtn : undefined}
            >
              {isLoading && <FiLoader className="animate-spin" />}
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('input');
                setOtp('');
                onError('');
              }}
              disabled={isLoading}
              className={t.backBtn}
              style={compact ? compactStyles.backBtn : undefined}
            >
              ← Back
            </button>
          </form>

          {/* Resend OTP */}
          <div className="mt-4 text-center text-sm text-slate-400">
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={() => {
                setOtp('');
                setStep('input');
              }}
              className={compact ? 'font-semibold hover:underline' : 'text-blue-400 hover:text-blue-300 font-semibold'}
              style={compact ? { color: 'var(--brand-light)' } : undefined}
            >Resend</button>
          </div>
        </div>
      </div>
    );
  }

  // step === 'input'
  return (
    <div className={compact ? '' : 'min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4'}>
      {!compact && <PopupToast message={error || statusMessage} variant={error ? 'error' : 'success'} />}
      <div className={compact ? 'w-full' : 'w-full max-w-md'} style={compact ? compactStyles.shell : undefined}>
        {compact && (
          <div className="mb-4 flex rounded-2xl border p-1" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
            <button
              type="button"
              className="flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition"
              style={compactStyles.tab(authMode === 'signin')}
              onClick={() => {
                setAuthMode('signin');
                setMethod('password');
                setStep('select');
                onError('');
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition"
              style={compactStyles.tab(authMode === 'signup')}
              onClick={() => {
                setAuthMode('signup');
                setMethod('password');
                setStep('input');
                onError('');
              }}
            >
              Sign up
            </button>
          </div>
        )}
        {compact ? (
          <div className="mb-4 space-y-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {authMode === 'signup' ? 'Create account' : method === 'password' ? 'Sign in' : method === 'email_otp' ? 'Email OTP' : 'WhatsApp OTP'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {authMode === 'signup' ? 'Fast account setup, mobile friendly.' : 'Continue with the method you selected.'}
            </p>
          </div>
        ) : null}

        {/* Header — hidden in compact/modal mode */}
        {!compact && (
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-blue-500/20 rounded-lg mb-4">
              {method === 'password' ? (
                <FiKey className="text-2xl text-blue-400" />
              ) : method === 'email_otp' ? (
                <FiMail className="text-2xl text-purple-400" />
              ) : (
                <FiPhone className="text-2xl text-green-400" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {method === 'password'
                ? 'Password Login'
                : method === 'email_otp'
                ? 'Email OTP Login'
                : 'WhatsApp OTP Login'}
            </h1>
          </div>
        )}

        {error ? <p className={`mb-3 ${t.errorBox}`} style={compact ? compactStyles.errorBox : undefined}>{error}</p> : null}
        {statusMessage ? <p className={`mb-3 ${t.successBox}`} style={compact ? compactStyles.successBox : undefined}>{statusMessage}</p> : null}

        {/* Login Form */}
        <form
          onSubmit={authMode === 'signup' ? handleSignup : method === 'password' ? handlePasswordLogin : handleRequestOtp}
          className={compact ? 'space-y-3' : 'space-y-4'}
        >
          {authMode === 'signup' ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  {compact
                    ? renderCompactField(
                        <FiUser className="h-4 w-4" />,
                        <input
                          type="text"
                          placeholder="First name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          disabled={isLoading}
                          required
                          autoFocus
                          className={t.input}
                          style={compactStyles.input}
                        />,
                      )
                    : <input
                        type="text"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={isLoading}
                        required
                        autoFocus
                        className={t.input}
                      />}
                </div>
                <div>
                  {compact
                    ? renderCompactField(
                        <FiUser className="h-4 w-4" />,
                        <input
                          type="text"
                          placeholder="Last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          disabled={isLoading}
                          className={t.input}
                          style={compactStyles.input}
                        />,
                      )
                    : <input
                        type="text"
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={isLoading}
                        className={t.input}
                      />}
                </div>
              </div>

              <div>
                {compact
                  ? renderCompactField(
                      <FiMail className="h-4 w-4" />,
                      <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        required
                        className={t.input}
                        style={compactStyles.input}
                      />,
                    )
                  : <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                      className={t.input}
                    />}
              </div>

              <div>
                {compact
                  ? renderCompactField(
                      <FiPhone className="h-4 w-4" />,
                      <input
                        type="tel"
                        placeholder="Mobile number"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        disabled={isLoading}
                        required
                        className={t.input}
                        style={compactStyles.input}
                      />,
                    )
                  : <input
                      type="tel"
                      placeholder="Mobile number"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      disabled={isLoading}
                      required
                      className={t.input}
                    />}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  {compact
                    ? renderCompactField(
                        <FiKey className="h-4 w-4" />,
                        <input
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading}
                          required
                          className={t.input}
                          style={compactStyles.input}
                        />,
                      )
                    : <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        required
                        className={t.input}
                      />}
                </div>
                <div>
                  {compact
                    ? renderCompactField(
                        <FiLock className="h-4 w-4" />,
                        <input
                          type="password"
                          placeholder="Confirm password"
                          value={passwordConfirm}
                          onChange={(e) => setPasswordConfirm(e.target.value)}
                          disabled={isLoading}
                          required
                          className={t.input}
                          style={compactStyles.input}
                        />,
                      )
                    : <input
                        type="password"
                        placeholder="Confirm password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        disabled={isLoading}
                        required
                        className={t.input}
                      />}
                </div>
              </div>
            </>
          ) : (
            <>
              {(method === 'password' || method === 'email_otp') && (
                <div>
                  {compact
                    ? renderCompactField(
                        <FiMail className="h-4 w-4" />,
                        <input
                          type="email"
                          placeholder="Email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                          required
                          autoFocus
                          className={t.input}
                          style={compactStyles.input}
                        />,
                      )
                    : <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        required
                        autoFocus
                        className={t.input}
                      />}
                </div>
              )}

              {method === 'whatsapp_otp' && (
                <div>
                  {compact
                    ? renderCompactField(
                        <FiPhone className="h-4 w-4" />,
                        <input
                          type="tel"
                          placeholder="WhatsApp number"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          disabled={isLoading}
                          required
                          autoFocus
                          className={t.input}
                          style={compactStyles.input}
                        />,
                      )
                    : <input
                        type="tel"
                        placeholder="Mobile number (e.g., +91 9999999999)"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        disabled={isLoading}
                        required
                        autoFocus
                        className={t.input}
                      />}
                </div>
              )}

              {method === 'password' && (
                <div className="space-y-2">
                  {compact
                    ? renderCompactField(
                        <FiKey className="h-4 w-4" />,
                        <input
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading}
                          required
                          className={t.input}
                          style={compactStyles.input}
                        />,
                      )
                    : <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        required
                        className={t.input}
                      />}
                  {compact && (
                    <div className="text-right">
                      <a href="/forgot-password" className="text-xs hover:underline" style={{ color: 'var(--brand-light)' }}>Forgot password?</a>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={t.submitBtn}
            style={compact ? compactStyles.submitBtn : undefined}
          >
            {isLoading && <FiLoader className="animate-spin" />}
            {isLoading ? 'Processing...' : authMode === 'signup' ? 'Create account' : method === 'password' ? 'Sign in' : 'Send OTP'}
          </button>

          <button
            type="button"
            onClick={() => {
              if (authMode === 'signup') {
                setAuthMode('signin');
              }
              setStep('select');
              onError('');
            }}
            disabled={isLoading}
            className={t.backBtn}
            style={compact ? compactStyles.backBtn : undefined}
          >
            ← {authMode === 'signup' ? 'Back to sign in' : 'Back to login methods'}
          </button>
        </form>

        {/* Footer Links — hidden in compact/modal mode */}
        {!compact && (
          <div className="mt-8 space-y-2 text-center text-sm">
            <div>
              <a href="/forgot-password" className="text-blue-400 hover:text-blue-300">
                Forgot password?
              </a>
            </div>
            <div className="text-slate-400">
              Don't have an account?{' '}
              <a href="/signup" className="text-blue-400 hover:text-blue-300 font-semibold">
                Sign up
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
