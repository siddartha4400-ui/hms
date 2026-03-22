'use client';

import React, { useState } from 'react';
import { FiArrowLeft, FiKey, FiLoader, FiMail, FiPhone, FiSend } from 'react-icons/fi';

type LoginMethod = 'password' | 'email_otp' | 'whatsapp_otp';
type Step = 'select' | 'input' | 'verify';

interface Props {
  onLogin: (
    method: LoginMethod,
    credentials: Record<string, string>,
  ) => Promise<{ success: boolean; message?: string }>;
  loading?: boolean;
  error?: string;
}

const inputCls =
  'h-11 w-full rounded-xl border border-black/10 bg-slate-50 px-4 text-sm outline-none transition focus:border-[#1b5e49] focus:bg-white';
const btnCls =
  'mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#17362e] text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#0f2721] disabled:cursor-not-allowed disabled:opacity-60';
const backBtnCls =
  'mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-800';

export default function LoginModalMolecule({ onLogin, loading = false, error = '' }: Props) {
  const [step, setStep] = useState<Step>('select');
  const [method, setMethod] = useState<LoginMethod>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const busy = loading || localLoading;

  function reset() {
    setStep('select');
    setEmail('');
    setPassword('');
    setMobile('');
    setOtp('');
    setStatusMsg('');
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalLoading(true);
    try {
      await onLogin('password', { email, password });
    } finally {
      setLocalLoading(false);
    }
  }

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setStatusMsg('');
    setLocalLoading(true);
    try {
      const identifier = method === 'email_otp' ? email : mobile;
      const result = await onLogin(method, { identifier });
      if (result.success) {
        setStatusMsg(result.message || 'OTP sent!');
        setStep('verify');
      }
    } finally {
      setLocalLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLocalLoading(true);
    try {
      const identifier = method === 'email_otp' ? email : mobile;
      await onLogin(method, { identifier, otp });
    } finally {
      setLocalLoading(false);
    }
  }

  // ── Method selection ─────────────────────────────────────────────────────
  if (step === 'select') {
    return (
      <div className="space-y-2 py-1">
        <button
          type="button"
          onClick={() => { setMethod('password'); setStep('input'); }}
          className="flex w-full items-center gap-3 rounded-xl border border-black/8 bg-slate-50 p-4 text-left transition hover:bg-slate-100"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <FiKey />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Password login</p>
            <p className="text-xs text-slate-500">Use your email and password</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setMethod('email_otp'); setStep('input'); }}
          className="flex w-full items-center gap-3 rounded-xl border border-black/8 bg-slate-50 p-4 text-left transition hover:bg-slate-100"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
            <FiMail />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Email OTP</p>
            <p className="text-xs text-slate-500">One-time code sent to your email</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setMethod('whatsapp_otp'); setStep('input'); }}
          className="flex w-full items-center gap-3 rounded-xl border border-black/8 bg-slate-50 p-4 text-left transition hover:bg-slate-100"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
            <FiPhone />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">WhatsApp OTP</p>
            <p className="text-xs text-slate-500">One-time code via WhatsApp</p>
          </div>
        </button>

        {error ? <p className="pt-1 text-xs text-red-600">{error}</p> : null}
      </div>
    );
  }

  // ── Password form ────────────────────────────────────────────────────────
  if (step === 'input' && method === 'password') {
    return (
      <form onSubmit={handlePasswordSubmit} className="space-y-3 py-1">
        <button type="button" onClick={reset} className={backBtnCls}>
          <FiArrowLeft /> Back
        </button>
        <label className="block space-y-1.5 text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            placeholder="you@example.com"
            required
          />
        </label>
        <label className="block space-y-1.5 text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
            placeholder="••••••••"
            required
          />
        </label>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
        <button type="submit" disabled={busy} className={btnCls}>
          {busy ? <FiLoader className="animate-spin" /> : null}
          Sign in
        </button>
      </form>
    );
  }

  // ── OTP request form ─────────────────────────────────────────────────────
  if (step === 'input' && (method === 'email_otp' || method === 'whatsapp_otp')) {
    const isEmail = method === 'email_otp';
    return (
      <form onSubmit={handleRequestOtp} className="space-y-3 py-1">
        <button type="button" onClick={reset} className={backBtnCls}>
          <FiArrowLeft /> Back
        </button>
        <label className="block space-y-1.5 text-sm font-medium text-slate-700">
          {isEmail ? 'Email address' : 'WhatsApp number'}
          <input
            type={isEmail ? 'email' : 'tel'}
            value={isEmail ? email : mobile}
            onChange={(e) => (isEmail ? setEmail(e.target.value) : setMobile(e.target.value))}
            className={inputCls}
            placeholder={isEmail ? 'you@example.com' : '+91 9999999999'}
            required
          />
        </label>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
        <button type="submit" disabled={busy} className={btnCls}>
          {busy ? <FiLoader className="animate-spin" /> : <FiSend className="text-xs" />}
          Send OTP
        </button>
      </form>
    );
  }

  // ── OTP verify form ──────────────────────────────────────────────────────
  return (
    <form onSubmit={handleVerifyOtp} className="space-y-3 py-1">
      <button type="button" onClick={() => setStep('input')} className={backBtnCls}>
        <FiArrowLeft /> Back
      </button>
      {statusMsg ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {statusMsg}
        </div>
      ) : null}
      <label className="block space-y-1.5 text-sm font-medium text-slate-700">
        Enter OTP
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          className={`${inputCls} text-center text-lg font-bold tracking-[0.5em]`}
          placeholder="000000"
          required
        />
      </label>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <button type="submit" disabled={busy} className={btnCls}>
        {busy ? <FiLoader className="animate-spin" /> : null}
        Verify OTP
      </button>
    </form>
  );
}
