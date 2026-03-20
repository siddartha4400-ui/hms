'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation } from '@apollo/client/react';
import { RESET_PASSWORD_MUTATION } from '@/project_components/login/graphql/operations';
import { FiLock } from 'react-icons/fi';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [formData, setFormData] = useState({
    password: '',
    passwordConfirm: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [resetPassword, { loading }] = useMutation(RESET_PASSWORD_MUTATION);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Invalid reset link');
      return;
    }

    try {
      const result = await resetPassword({
        variables: {
          token,
          password: formData.password,
          passwordConfirm: formData.passwordConfirm,
        },
      });

      if (result.data?.resetPassword?.success) {
        setSuccess('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(result.data?.resetPassword?.message || 'Password reset failed');
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
            <FiLock className="text-2xl text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create New Password</h1>
          <p className="text-slate-400">Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="password"
            name="password"
            placeholder="New password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />

          <input
            type="password"
            name="passwordConfirm"
            placeholder="Confirm password"
            value={formData.passwordConfirm}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>

          <div className="text-center text-sm text-slate-400">
            <Link href="/login" className="text-blue-400 hover:text-blue-300">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
