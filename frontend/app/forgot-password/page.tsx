'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { REQUEST_PASSWORD_RESET_MUTATION } from '@/project_components/login/graphql/operations';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [requestReset, { loading }] = useMutation(REQUEST_PASSWORD_RESET_MUTATION);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const result = await requestReset({
        variables: { email },
      });

      if (result.data?.requestPasswordReset?.success) {
        setSuccess(result.data?.requestPasswordReset?.message || 'Reset link sent to your email');
        setSubmitted(true);
        setEmail('');
      } else {
        setError(result.data?.requestPasswordReset?.message || 'Failed to send reset link');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-blue-500/20 rounded-lg mb-4">
            <FiMail className="text-2xl text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-slate-400">Enter your email to receive a reset link</p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 font-semibold"
            >
              <FiArrowLeft className="text-sm" /> Back to Login
            </Link>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
              <p className="text-green-200">
                {success || 'If an account exists with that email, you will receive a password reset link.'}
              </p>
            </div>

            <div className="text-center text-sm text-slate-400">
              <p className="mb-4">Check your email for the reset link (may take a few moments)</p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 font-semibold"
              >
                <FiArrowLeft className="text-sm" /> Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
