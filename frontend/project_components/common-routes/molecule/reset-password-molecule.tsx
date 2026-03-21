import { FiLock, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';
import { Button, InputBox, PopupToast } from '@/components';

interface ResetPasswordMoleculeProps {
  formData: {
    password: string;
    passwordConfirm: string;
  };
  loading: boolean;
  error: string;
  statusMessage: string;
  hasValidToken: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ResetPasswordMolecule({
  formData,
  loading,
  error,
  statusMessage,
  hasValidToken,
  onChange,
  onSubmit,
}: ResetPasswordMoleculeProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <PopupToast
        message={error || statusMessage}
        variant={error ? 'error' : 'success'}
      />
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-purple-500/20 rounded-lg mb-4">
            <FiLock className="text-2xl text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create New Password</h1>
          <p className="text-slate-400">Enter a new password for your account</p>
        </div>

        {/* Invalid Token */}
        {!hasValidToken && (
          <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg mb-6">
            <p className="text-red-300 text-sm">Invalid or expired reset link. Please request a new one.</p>
          </div>
        )}

        {/* Form */}
        {hasValidToken && !statusMessage && (
          <form onSubmit={onSubmit} className="space-y-4">
            <InputBox
              type="password"
              name="password"
              placeholder="New password"
              value={formData.password}
              onChange={onChange}
              disabled={loading}
              required
              icon={FiLock}
            />

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

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
