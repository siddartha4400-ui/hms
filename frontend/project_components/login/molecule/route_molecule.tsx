'use client';

import React, { useState } from 'react';
import { FiLock, FiLogIn, FiMail, FiPhone, FiKey, FiLoader } from 'react-icons/fi';

type LoginMethod = 'password' | 'email_otp' | 'whatsapp_otp';
type Step = 'select' | 'input' | 'verify';

interface Props {
  onLogin: (method: LoginMethod, credentials: any) => Promise<{ success: boolean; message?: string; token?: string }>;
  onError: (message: string) => void;
  error?: string;
  loading?: boolean;
}

export default function RouteMolecule({ onLogin, onError, error = '', loading = false }: Props) {
  const [step, setStep] = useState<Step>('select');
  const [method, setMethod] = useState<LoginMethod>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const isLoading = loading || localLoading;

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
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-blue-500/20 rounded-lg mb-4">
              <FiLogIn className="text-2xl text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">HotelSphere</h1>
            <p className="text-slate-400">Choose your login method</p>
          </div>

          {/* Login Methods */}
          <div className="space-y-3">
            {/* Password Login */}
            <button
              onClick={() => {
                setMethod('password');
                setStep('input');
              }}
              className="w-full p-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg transition-all group"
            >
              <div className="flex items-center gap-3">
                <FiKey className="text-xl text-blue-400 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="font-semibold text-white">Password Login</div>
                  <div className="text-sm text-slate-400">Use your email and password</div>
                </div>
              </div>
            </button>

            {/* Email OTP */}
            <button
              onClick={() => {
                setMethod('email_otp');
                setStep('input');
              }}
              className="w-full p-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg transition-all group"
            >
              <div className="flex items-center gap-3">
                <FiMail className="text-xl text-purple-400 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="font-semibold text-white">Email OTP</div>
                  <div className="text-sm text-slate-400">6-digit code sent to email</div>
                </div>
              </div>
            </button>

            {/* WhatsApp OTP */}
            <button
              onClick={() => {
                setMethod('whatsapp_otp');
                setStep('input');
              }}
              className="w-full p-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg transition-all group"
            >
              <div className="flex items-center gap-3">
                <FiPhone className="text-xl text-green-400 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="font-semibold text-white">WhatsApp OTP</div>
                  <div className="text-sm text-slate-400">6-digit code sent via WhatsApp</div>
                </div>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <a href="/signup" className="text-blue-400 hover:text-blue-300 font-semibold">
              Sign up
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-blue-500/20 rounded-lg mb-4">
              <FiLock className="text-2xl text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Verify OTP</h1>
            <p className="text-slate-400">
              Enter the 6-digit code sent to {method === 'email_otp' ? email : mobileNumber}
            </p>
          </div>

          {/* OTP Verification Form */}
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            {error && (
              <div className="px-4 py-3 rounded-lg border border-rose-400/40 bg-rose-500/10 text-rose-200 text-sm animate-pulse">
                {error}
              </div>
            )}
            {statusMessage && (
              <div className="px-4 py-3 rounded-lg border border-emerald-400/40 bg-emerald-500/10 text-emerald-200 text-sm">
                {statusMessage}
              </div>
            )}
            <input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              disabled={isLoading}
              required
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-center text-2xl font-bold tracking-widest text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {isLoading && <FiLoader className="animate-spin" />}
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('select');
                setOtp('');
              }}
              disabled={isLoading}
              className="w-full text-slate-400 hover:text-white transition-colors"
            >
              Back to login methods
            </button>
          </form>

          {/* Resend OTP */}
          <div className="mt-6 text-center text-sm text-slate-400">
            Didn't receive the code?{' '}
            <button className="text-blue-400 hover:text-blue-300 font-semibold">Resend</button>
          </div>
        </div>
      </div>
    );
  }

  // step === 'input'
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
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

        {/* Login Form */}
        <form
          onSubmit={method === 'password' ? handlePasswordLogin : handleRequestOtp}
          className="space-y-6"
        >
          {error && (
            <div className="px-4 py-3 rounded-lg border border-rose-400/40 bg-rose-500/10 text-rose-200 text-sm animate-pulse">
              {error}
            </div>
          )}
          {statusMessage && (
            <div className="px-4 py-3 rounded-lg border border-emerald-400/40 bg-emerald-500/10 text-emerald-200 text-sm">
              {statusMessage}
            </div>
          )}
          {(method === 'password' || method === 'email_otp') && (
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />
          )}

          {method === 'whatsapp_otp' && (
            <input
              type="tel"
              placeholder="Mobile number (e.g., +1 234 567 8900)"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              disabled={isLoading}
              required
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />
          )}

          {method === 'password' && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {isLoading && <FiLoader className="animate-spin" />}
            {isLoading ? 'Processing...' : 'Continue'}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep('select');
              setEmail('');
              setPassword('');
              setMobileNumber('');
            }}
            disabled={isLoading}
            className="w-full text-slate-400 hover:text-white transition-colors"
          >
            Back to login methods
          </button>
        </form>

        {/* Footer Links */}
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
      </div>
    </div>
  );
}
