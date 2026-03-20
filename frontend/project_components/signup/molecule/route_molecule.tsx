import { FiUser, FiMail, FiPhone, FiKey, FiLock } from 'react-icons/fi';
import Link from 'next/link';
import { Button, InputBox } from '@/components';

interface SignupMoleculeProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    mobileNumber: string;
    password: string;
    passwordConfirm: string;
  };
  loading: boolean;
  error: string;
  statusMessage: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function SignupMolecule({
  formData,
  loading,
  error,
  statusMessage,
  onChange,
  onSubmit,
}: SignupMoleculeProps) {
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

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Success Banner */}
        {statusMessage && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg">
            <p className="text-green-300 text-sm">{statusMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-3">
            <InputBox
              type="text"
              name="firstName"
              placeholder="First name"
              value={formData.firstName}
              onChange={onChange}
              disabled={loading}
              required
              icon={FiUser}
            />
            <InputBox
              type="text"
              name="lastName"
              placeholder="Last name"
              value={formData.lastName}
              onChange={onChange}
              disabled={loading}
              icon={FiUser}
            />
          </div>

          {/* Email */}
          <InputBox
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={onChange}
            disabled={loading}
            required
            icon={FiMail}
          />

          {/* Mobile */}
          <InputBox
            type="tel"
            name="mobileNumber"
            placeholder="Mobile number"
            value={formData.mobileNumber}
            onChange={onChange}
            disabled={loading}
            required
            icon={FiPhone}
          />

          {/* Password */}
          <InputBox
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={onChange}
            disabled={loading}
            required
            icon={FiKey}
          />

          {/* Confirm Password */}
          <InputBox
            type="password"
            name="passwordConfirm"
            placeholder="Confirm password"
            value={formData.passwordConfirm}
            onChange={onChange}
            disabled={loading}
            required
            icon={FiLock}
          />

          {/* Submit Button */}
          <Button type="submit" disabled={loading} className="w-full mt-6">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-slate-400 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-green-400 hover:text-green-300 font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
