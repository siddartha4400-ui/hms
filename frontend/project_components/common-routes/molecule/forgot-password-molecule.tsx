import { FiMail, FiArrowLeft, FiCheckCircle, FiSend } from 'react-icons/fi';
import Link from 'next/link';
import { InputBox, PopupToast } from '@/components';

interface ForgotPasswordMoleculeProps {
  email: string;
  loading: boolean;
  error: string;
  statusMessage: string;
  submitted: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ForgotPasswordMolecule({
  email,
  loading,
  error,
  statusMessage,
  submitted,
  onChange,
  onSubmit,
}: ForgotPasswordMoleculeProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0a0f1e] p-4 sm:p-6 lg:p-8">
      <PopupToast
        message={error || statusMessage}
        variant={error ? 'error' : 'success'}
      />
      {/* Ambient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Grid texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Glassmorphism card */}
        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 p-6 sm:p-8 lg:p-10">

          {!submitted ? (
            <>
              {/* Icon + Header */}
              <div className="text-center mb-8">
                <div className="relative inline-flex items-center justify-center mb-5">
                  <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-xl" />
                  <div className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500/30 to-violet-500/30 border border-blue-400/30 rounded-2xl">
                    <FiMail className="w-7 h-7 text-blue-400" />
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
                  Forgot Password?
                </h1>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                  No worries. Enter your email and we'll send you a reset link.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Email address
                  </label>
                  <InputBox
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={onChange}
                    disabled={loading}
                    required
                    icon={FiMail}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    relative w-full flex items-center justify-center gap-2
                    px-6 py-3 rounded-xl font-semibold text-sm text-white
                    bg-gradient-to-r from-blue-600 to-violet-600
                    hover:from-blue-500 hover:to-violet-500
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-transparent
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200 shadow-lg shadow-blue-500/20
                    active:scale-[0.98]
                  "
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    <>
                      <FiSend className="w-4 h-4" />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success state */
            <div className="text-center py-4">
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl" />
                <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-full">
                  <FiCheckCircle className="w-9 h-9 text-green-400" />
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Check your inbox</h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-2">
                We've sent a password reset link to
              </p>
              <p className="text-blue-400 font-medium text-sm sm:text-base break-all mb-6">
                {email || 'your email address'}
              </p>
              <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                <p className="text-slate-500 text-xs leading-relaxed">
                  Didn't receive the email? Check your spam or junk folder, or try again in a few minutes.
                </p>
              </div>
            </div>
          )}

          {/* Back to login */}
          <div className="mt-7 pt-6 border-t border-white/[0.06] text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors duration-200 group"
            >
              <FiArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
              Back to Login
            </Link>
          </div>
        </div>

        {/* Bottom branding */}
        <p className="text-center text-slate-600 text-xs mt-6">
          © {new Date().getFullYear()} HMS · Hotel Management System
        </p>
      </div>
    </div>
  );
}
