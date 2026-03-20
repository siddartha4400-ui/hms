'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { UPDATE_PROFILE_MUTATION, GET_USER_PROFILE_QUERY } from '@/project_components/login/graphql/operations';
import { FiUser, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  dob: string;
}

export default function ProfilePage() {
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: profileData, loading: profileLoading } = useQuery(GET_USER_PROFILE_QUERY);
  const [updateProfile, { loading: updateLoading }] = useMutation(UPDATE_PROFILE_MUTATION);

  useEffect(() => {
    if (profileData?.getUserProfile) {
      setFormData(profileData.getUserProfile);
    }
  }, [profileData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const updateData: any = {};
      const allowedFields = [
        'firstName',
        'lastName',
        'addressLine1',
        'addressLine2',
        'city',
        'state',
        'postalCode',
        'country',
        'dob',
      ];

      allowedFields.forEach((field) => {
        if (field in formData) {
          updateData[field] = formData[field as keyof UserProfile];
        }
      });

      const result = await updateProfile({
        variables: updateData,
      });

      if (result.data?.updateProfile?.success) {
        setSuccess('Profile updated successfully!');
      } else {
        setError(result.data?.updateProfile?.message || 'Update failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="inline-block p-3 bg-blue-500/20 rounded-lg">
              <FiUser className="text-2xl text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Edit Profile</h1>
              <p className="text-slate-400">Update your account information</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <FiArrowLeft /> Back
          </Link>
        </div>

        {/* Warning: Email and Phone are disabled */}
        <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          <p className="text-sm text-slate-300">
            <strong>Note:</strong> Email and mobile number cannot be changed. Contact support for assistance.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 space-y-6">
          {/* Read-only Fields */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email (Cannot be changed)</label>
            <input
              type="email"
              value={formData.email || ''}
              disabled
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-700 rounded-lg text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Mobile (Cannot be changed)</label>
            <input
              type="tel"
              value={formData.mobileNumber || ''}
              disabled
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-700 rounded-lg text-slate-500 cursor-not-allowed"
            />
          </div>

          {/* Editable Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName || ''}
                onChange={handleChange}
                disabled={updateLoading}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName || ''}
                onChange={handleChange}
                disabled={updateLoading}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Address Line 1</label>
            <input
              type="text"
              name="addressLine1"
              value={formData.addressLine1 || ''}
              onChange={handleChange}
              disabled={updateLoading}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Address Line 2</label>
            <input
              type="text"
              name="addressLine2"
              value={formData.addressLine2 || ''}
              onChange={handleChange}
              disabled={updateLoading}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">City</label>
              <input
                type="text"
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
                disabled={updateLoading}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">State</label>
              <input
                type="text"
                name="state"
                value={formData.state || ''}
                onChange={handleChange}
                disabled={updateLoading}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Postal Code</label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode || ''}
                onChange={handleChange}
                disabled={updateLoading}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country || ''}
                onChange={handleChange}
                disabled={updateLoading}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Date of Birth</label>
            <input
              type="datetime-local"
              name="dob"
              value={formData.dob || ''}
              onChange={handleChange}
              disabled={updateLoading}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />
          </div>

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
            disabled={updateLoading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
          >
            {updateLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
