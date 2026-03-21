import { FiUser, FiArrowLeft, FiPhone, FiMapPin, FiCamera, FiImage } from 'react-icons/fi';
import Link from 'next/link';
import { Button, InputBox, AttachmentUploader, PopupToast, ThemedDatePicker } from '@/components';
import type { UploadedAttachment } from '@/components/AttachmentUploader';
import { getInitials } from '@/lib/profile-avatar';

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
  profileId?: number;
  profilePictureUrl?: string;
  dob?: string;
}

interface ProfileMoleculeProps {
  formData: Partial<UserProfile>;
  loading: boolean;
  error: string;
  statusMessage: string;
  profileLoaded: boolean;
  onAvatarUpload: (attachments: UploadedAttachment[]) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ProfileMolecule({
  formData,
  loading,
  error,
  statusMessage,
  profileLoaded,
  onAvatarUpload,
  onChange,
  onSubmit,
}: ProfileMoleculeProps) {
  const initials = getInitials(formData.firstName, formData.lastName, formData.email);

  return (
    <div className="min-h-screen w-full p-4 sm:p-6" style={{ background: 'var(--bg-base)' }}>
      <PopupToast
        message={error || statusMessage}
        variant={error ? 'error' : 'success'}
      />
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="inline-block p-3 bg-cyan-500/20 rounded-lg">
              <FiUser className="text-2xl text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>My Profile</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Update your account information</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <FiArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-6 lg:sticky lg:top-24 self-start">
            <div className="rounded-2xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <h2 className="text-lg font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Profile Photo</h2>
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-2xl" />
                  <div className="relative w-28 h-28 rounded-full overflow-hidden border border-cyan-500/30 flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                    {formData.profilePictureUrl ? (
                      <img
                        src={formData.profilePictureUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-semibold text-cyan-300">{initials}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center border-4 border-slate-900">
                    <FiCamera className="w-4 h-4" />
                  </div>
                </div>

                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{formData.firstName || 'User'} {formData.lastName || ''}</p>
                <p className="text-sm break-all" style={{ color: 'var(--text-secondary)' }}>{formData.email || 'No email available'}</p>
              </div>

              <div className="mt-6">
                <AttachmentUploader
                  entityType="user-profile"
                  entityId={formData.id || 0}
                  hmsId={formData.id || 0}
                  uploadedBy={formData.id}
                  multiple={false}
                  accept="image/*"
                  disabled={loading || !profileLoaded || !formData.id}
                  label="Upload profile image"
                  className="bg-transparent"
                  showUploadedList={false}
                  onUploadComplete={onAvatarUpload}
                />
              </div>

              <div className="mt-4 flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <FiImage className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Upload a square image for the cleanest result. Your new profile picture will appear in the top navbar immediately.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
          {/* Personal Info */}
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
                <div className="relative h-12">
                  <span className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none" style={{ color: 'var(--text-secondary)' }}>
                    <img src="/Icons/profile-icons/email-icon.svg" alt="Email" className="w-[18px] h-[18px]" />
                  </span>
                  <input
                    type="email"
                    value={formData.email || ''}
                    disabled
                    className="w-full h-12 leading-6 rounded-lg cursor-not-allowed"
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      paddingLeft: '3.25rem',
                      paddingRight: '1rem',
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Mobile Number</label>
                <InputBox
                  type="tel"
                  name="mobileNumber"
                  placeholder="Mobile number"
                  value={formData.mobileNumber || ''}
                  disabled
                  icon={FiPhone}
                  className="cursor-not-allowed"
                />
              </div>
            </div>
            <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              Email and mobile number are locked. Contact an administrator if they need to be changed.
            </p>
            <div className="mt-4">
              <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Date of Birth</label>
              <ThemedDatePicker
                value={formData.dob || ''}
                onChange={(date) => onChange({ target: { name: 'dob', value: date } } as React.ChangeEvent<HTMLInputElement>)}
                disabled={loading}
                placeholder="Date of birth"
              />
            </div>
          </div>

          {/* Address Info */}
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Address</h2>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <Button type="submit" disabled={loading || !profileLoaded} className="w-full">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
