'use client';

import React, { useState } from 'react';
import { FiLock, FiLogIn, FiMail, FiPhone, FiKey, FiLoader } from 'react-icons/fi';
import { PopupToast } from '@/components';

type LoginMethod = 'password' | 'email_otp' | 'whatsapp_otp';
type Step = 'select' | 'input' | 'verify';

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
  const [method, setMethod] = useState<LoginMethod>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const isLoading = loading || localLoading;

  // Compact-mode step labels for the breadcrumb progress bar
  const steps: Step[] = ['select', 'input', 'verify'];
  const stepLabels: Record<Step, string> = { select: 'Method', input: 'Details', verify: 'Verify' };

  // Tailwind class helpers that differ between light (compact) and dark (full-page) modes
  const t = {
    methodBtn: compact
      ? 'w-full p-4 bg-slate-50 hover:bg-slate-100 border border-black/8 rounded-xl transition-all group text-left'
      : 'w-full p-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg transition-all group text-left',
    methodTitle: compact ? 'font-semibold text-slate-800' : 'font-semibold text-white',
    methodSub: compact ? 'text-sm text-slate-500' : 'text-sm text-slate-400',
    input: compact
      ? 'w-full px-4 py-3 bg-white border border-black/10 rounded-xl text-slate-900 placeholder-slate-400 focus:border-[#1b5e49] focus:outline-none disabled:opacity-50 transition'
      : 'w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50',
    otpInput: compact
      ? 'w-full px-4 py-4 bg-white border-2 border-black/10 rounded-2xl text-center text-3xl font-bold tracking-[0.6em] text-slate-900 placeholder-slate-300 focus:border-[#1b5e49] focus:outline-none disabled:opacity-50 transition'
      : 'w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-center text-2xl font-bold tracking-widest text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50',
    submitBtn: compact
      ? 'w-full py-3 bg-[#17362e] hover:bg-[#0f2721] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2'
      : 'w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2',
    backBtn: compact
      ? 'w-full text-sm text-slate-500 hover:text-slate-900 transition-colors py-1'
      : 'w-full text-slate-400 hover:text-white transition-colors',
    errorBox: compact
      ? 'rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'
      : 'text-red-400 text-sm text-center',
    successBox: compact
      ? 'rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'
      : 'text-emerald-400 text-sm text-center',
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

  if (step === 'select') {
    return (
      <div className={compact ? '' : 'min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4'}>
        {!compact && <PopupToast message={error || statusMessage} variant={error ? 'error' : 'success'} />}
        <div className={compact ? 'w-full' : 'w-full max-w-md'}>
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
                setMethod('password');
                setStep('input');
              }}
              className={t.methodBtn}
            >
              <div className="flex items-center gap-3">
                <FiKey className="text-xl text-blue-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className={t.methodTitle}>Password Login</div>
                  <div className={t.methodSub}>Use your email and password</div>
                </div>
              </div>
            </button>

            {/* Email OTP */}
            <button
              onClick={() => {
                setMethod('email_otp');
                setStep('input');
              }}
              className={t.methodBtn}
            >
              <div className="flex items-center gap-3">
                <FiMail className="text-xl text-purple-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className={t.methodTitle}>Email OTP</div>
                  <div className={t.methodSub}>6-digit code sent to email</div>
                </div>
              </div>
            </button>

            {/* WhatsApp OTP */}
            <button
              onClick={() => {
                setMethod('whatsapp_otp');
                setStep('input');
              }}
              className={t.methodBtn}
            >
              <div className="flex items-center gap-3">
                <FiPhone className="text-xl text-green-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className={t.methodTitle}>WhatsApp OTP</div>
                  <div className={t.methodSub}>6-digit code sent via WhatsApp</div>
                </div>
              </div>
            </button>
          </div>

          {error ? <p className={`mt-3 ${t.errorBox}`}>{error}</p> : null}

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
        <div className={compact ? 'w-full' : 'w-full max-w-md'}>
          {/* Step progress — compact only */}
          {compact && (
            <div className="mb-4 flex items-center gap-2">
              {steps.map((s, i) => (
                <React.Fragment key={s}>
                  <span className={`text-xs font-semibold ${
                    s === step ? 'text-[#17362e]' : steps.indexOf(step) > i ? 'text-emerald-600' : 'text-slate-400'
                  }`}>{stepLabels[s]}</span>
                  {i < steps.length - 1 && <span className="flex-1 h-px bg-black/10" />}
                </React.Fragment>
              ))}
            </div>
          )}

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
          {compact && (
            <p className="mb-3 text-sm text-slate-500">
              Code sent to <span className="font-semibold text-slate-800">{method === 'email_otp' ? email : mobileNumber}</span>
            </p>
          )}

          {statusMessage ? <p className={`mb-3 ${t.successBox}`}>{statusMessage}</p> : null}
          {error ? <p className={`mb-3 ${t.errorBox}`}>{error}</p> : null}

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
            />

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className={t.submitBtn}
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
              className={compact ? 'font-semibold text-[#17362e] hover:underline' : 'text-blue-400 hover:text-blue-300 font-semibold'}
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
      <div className={compact ? 'w-full' : 'w-full max-w-md'}>
        {/* Step progress — compact only */}
        {compact && (
          <div className="mb-4 flex items-center gap-2">
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                <span className={`text-xs font-semibold ${
                  s === step ? 'text-[#17362e]' : steps.indexOf(step) > i ? 'text-emerald-600' : 'text-slate-400'
                }`}>{stepLabels[s]}</span>
                {i < steps.length - 1 && <span className="flex-1 h-px bg-black/10" />}
              </React.Fragment>
            ))}
          </div>
        )}

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

        {error ? <p className={`mb-3 ${t.errorBox}`}>{error}</p> : null}

        {/* Login Form */}
        <form
          onSubmit={method === 'password' ? handlePasswordLogin : handleRequestOtp}
          className="space-y-4"
        >
          {(method === 'password' || method === 'email_otp') && (
            <div className="space-y-1.5">
              {compact && <label className="text-sm font-medium text-slate-700">Email address</label>}
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                autoFocus
                className={t.input}
              />
            </div>
          )}

          {method === 'whatsapp_otp' && (
            <div className="space-y-1.5">
              {compact && <label className="text-sm font-medium text-slate-700">WhatsApp number</label>}
              <input
                type="tel"
                placeholder="Mobile number (e.g., +91 9999999999)"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                disabled={isLoading}
                required
                autoFocus
                className={t.input}
              />
            </div>
          )}

          {method === 'password' && (
            <div className="space-y-1.5">
              {compact && <label className="text-sm font-medium text-slate-700">Password</label>}
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className={t.input}
              />
              {compact && (
                <div className="text-right">
                  <a href="/forgot-password" className="text-xs text-[#17362e] hover:underline">Forgot password?</a>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={t.submitBtn}
          >
            {isLoading && <FiLoader className="animate-spin" />}
            {isLoading ? 'Processing...' : method === 'password' ? 'Sign in' : 'Send OTP'}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep('select');
              setEmail('');
              setPassword('');
              setMobileNumber('');
              onError('');
            }}
            disabled={isLoading}
            className={t.backBtn}
          >
            ← Back to login methods
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
