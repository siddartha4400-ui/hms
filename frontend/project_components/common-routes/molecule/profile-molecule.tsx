import { FiUser, FiArrowLeft, FiMail, FiPhone, FiMapPin, FiCalendar } from 'react-icons/fi';
import Link from 'next/link';
import { Button, InputBox } from '@/components';

interface UserProfile {
  id?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  dob?: string;
}

interface ProfileMoleculeProps {
  formData: Partial<UserProfile>;
  loading: boolean;
  error: string;
  statusMessage: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ProfileMolecule({
  formData,
  loading,
  error,
  statusMessage,
  onChange,
  onSubmit,
}: ProfileMoleculeProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="inline-block p-3 bg-cyan-500/20 rounded-lg">
              <FiUser className="text-2xl text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">My Profile</h1>
              <p className="text-slate-400">Update your account information</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back
          </Link>
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
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Personal Info */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <InputBox
                type="text"
                name="firstName"
                placeholder="First name"
                value={formData.firstName || ''}
                onChange={onChange}
                disabled={loading}
                icon={FiUser}
              />
              <InputBox
                type="text"
                name="lastName"
                placeholder="Last name"
                value={formData.lastName || ''}
                onChange={onChange}
                disabled={loading}
                icon={FiUser}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
                />
              </div>
              <InputBox
                type="tel"
                name="mobileNumber"
                placeholder="Mobile number"
                value={formData.mobileNumber || ''}
                onChange={onChange}
                disabled={loading}
                icon={FiPhone}
              />
            </div>
            <div className="mt-4">
              <InputBox
                type="date"
                name="dob"
                placeholder="Date of birth"
                value={formData.dob || ''}
                onChange={onChange}
                disabled={loading}
                icon={FiCalendar}
              />
            </div>
          </div>

          {/* Address Info */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Address</h2>
            <div className="space-y-4">
              <InputBox
                type="text"
                name="addressLine1"
                placeholder="Address line 1"
                value={formData.addressLine1 || ''}
                onChange={onChange}
                disabled={loading}
                icon={FiMapPin}
              />
              <InputBox
                type="text"
                name="addressLine2"
                placeholder="Address line 2"
                value={formData.addressLine2 || ''}
                onChange={onChange}
                disabled={loading}
                icon={FiMapPin}
              />
              <div className="grid grid-cols-2 gap-4">
                <InputBox
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city || ''}
                  onChange={onChange}
                  disabled={loading}
                />
                <InputBox
                  type="text"
                  name="state"
                  placeholder="State"
                  value={formData.state || ''}
                  onChange={onChange}
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputBox
                  type="text"
                  name="postalCode"
                  placeholder="Postal code"
                  value={formData.postalCode || ''}
                  onChange={onChange}
                  disabled={loading}
                />
                <InputBox
                  type="text"
                  name="country"
                  placeholder="Country"
                  value={formData.country || ''}
                  onChange={onChange}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </div>
    </div>
  );
}
