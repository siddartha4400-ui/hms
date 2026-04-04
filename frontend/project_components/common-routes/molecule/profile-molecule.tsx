import { useState } from 'react';
import { FiUser, FiArrowLeft, FiPhone, FiMapPin, FiEdit2, FiEye } from 'react-icons/fi';
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
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);

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
                <AttachmentUploader
                  entityType="user-profile"
                  entityId={formData.id || 0}
                  hmsId={formData.id || 0}
                  uploadedBy={formData.id}
                  multiple={false}
                  accept="image/*"
                  disabled={loading || !profileLoaded || !formData.id}
                  showUploadedList={false}
                  triggerOnly
                  className="relative mb-5"
                  onUploadComplete={onAvatarUpload}
                  triggerRenderer={({ openFilePicker, uploading, disabled }) => (
                    <div
                      className="relative"
                      onMouseEnter={() => setIsAvatarHovered(true)}
                      onMouseLeave={() => setIsAvatarHovered(false)}
                    >
                      {/* glow ring */}
                      <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-2xl" />

                      {/* avatar circle */}
                      <div
                        className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-cyan-500/40 flex items-center justify-center"
                        style={{ background: 'var(--bg-elevated)' }}
                      >
                        {/* image / initials – blur on hover */}
                        {formData.profilePictureUrl ? (
                          <img
                            src={formData.profilePictureUrl}
                            alt="Profile"
                            style={{
                              transition: 'filter 0.3s, transform 0.3s',
                              filter: isAvatarHovered ? 'blur(3px) brightness(0.7)' : 'none',
                              transform: isAvatarHovered ? 'scale(1.06)' : 'scale(1)',
                            }}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span
                            className="text-3xl font-semibold text-cyan-300"
                            style={{
                              transition: 'filter 0.3s',
                              filter: isAvatarHovered ? 'blur(2px) brightness(0.6)' : 'none',
                            }}
                          >
                            {initials}
                          </span>
                        )}

                        {/* hover overlay – View button */}
                        <div
                          className="absolute inset-0 flex flex-col items-center justify-center rounded-full"
                          style={{
                            background: 'rgba(0,0,0,0.45)',
                            opacity: isAvatarHovered ? 1 : 0,
                            pointerEvents: isAvatarHovered ? 'auto' : 'none',
                            transition: 'opacity 0.25s',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setIsAvatarPreviewOpen(true)}
                            disabled={!formData.profilePictureUrl}
                            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white bg-white/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white shadow backdrop-blur-sm hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <FiEye className="h-3.5 w-3.5" />
                            View
                          </button>
                        </div>
                      </div>

                      {/* edit badge – fully round, triggers file picker */}
                      <button
                        type="button"
                        onClick={openFilePicker}
                        disabled={disabled}
                        title={uploading ? 'Uploading…' : 'Change profile photo'}
                        style={{
                          position: 'absolute',
                          bottom: '-4px',
                          right: '-4px',
                          zIndex: 40,
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: '3px solid var(--bg-surface)',
                          background: '#06b6d4',
                          color: '#0f172a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                          cursor: 'pointer',
                          flexShrink: 0,
                          outline: 'none',
                          transition: 'background 0.2s',
                        }}
                      >
                        <FiEdit2 style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  )}
                />

                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{formData.firstName || 'User'} {formData.lastName || ''}</p>
                <p className="text-sm break-all" style={{ color: 'var(--text-secondary)' }}>{formData.email || 'No email available'}</p>
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

        {isAvatarPreviewOpen && formData.profilePictureUrl ? (
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setIsAvatarPreviewOpen(false);
              }
            }}
          >
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <p className="text-sm font-semibold text-slate-100">Profile photo preview</p>
                <button
                  type="button"
                  onClick={() => setIsAvatarPreviewOpen(false)}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-200"
                >
                  Close
                </button>
              </div>

              <div className="max-h-[75vh] overflow-auto bg-slate-900 p-3">
                <img
                  src={formData.profilePictureUrl}
                  alt="Profile preview"
                  className="mx-auto max-h-[70vh] w-auto max-w-full rounded-lg border border-slate-700 bg-black/20 object-contain"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
