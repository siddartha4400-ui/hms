'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client/react';
import { SIGNUP_MUTATION } from '@/project_components/login/graphql/operations';
import { FiUser, FiMail, FiPhone, FiKey, FiLock } from 'react-icons/fi';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    password: '',
    passwordConfirm: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [signup, { loading }] = useMutation(SIGNUP_MUTATION);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const result = await signup({
        variables: {
          email: formData.email,
          password: formData.password,
          passwordConfirm: formData.passwordConfirm,
          mobileNumber: formData.mobileNumber,
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
      });

      if (result.data?.signup?.success) {
        setSuccess('Sign up successful! Redirecting to login...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(result.data?.signup?.message || 'Sign up failed');
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
          <div className="inline-block p-3 bg-green-500/20 rounded-lg mb-4">
            <FiUser className="text-2xl text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-slate-400">Join HotelSphere today</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="firstName"
              placeholder="First name"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-green-500 focus:outline-none disabled:opacity-50"
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last name"
              value={formData.lastName}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-green-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-green-500 focus:outline-none disabled:opacity-50"
          />

          <input
            type="tel"
            name="mobileNumber"
            placeholder="Mobile number"
            value={formData.mobileNumber}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-green-500 focus:outline-none disabled:opacity-50"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-green-500 focus:outline-none disabled:opacity-50"
          />

          <input
            type="password"
            name="passwordConfirm"
            placeholder="Confirm password"
            value={formData.passwordConfirm}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-green-500 focus:outline-none disabled:opacity-50"
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
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <a href="/login" className="text-green-400 hover:text-green-300 font-semibold">
              Login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
