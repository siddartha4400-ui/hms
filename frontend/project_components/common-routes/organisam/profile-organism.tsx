'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import type { UploadedAttachment } from '@/components/AttachmentUploader';
import { normalizeAvatarUrl, syncProfileIdentity } from '@/lib/profile-avatar';
import { UPDATE_PROFILE_MUTATION, GET_USER_PROFILE_QUERY } from '../graphql/operations';
import ProfileMolecule from '../molecule/profile-molecule';

interface UserProfile {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  companyId: string;
  profileId: number;
  profilePictureUrl: string;
  dob: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GetUserProfileData {
  getUserProfile: UserProfile;
}

interface UpdateProfileData {
  updateProfile: {
    success: boolean;
    message: string;
  };
}

interface UpdateProfileVariables {
  firstName?: string;
  lastName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  dob?: string;
  profileId?: number;
}

function normalizeDobForInput(value?: string): string {
  if (!value) {
    return '';
  }

  const text = value.trim();
  if (!text) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().slice(0, 10);
}

export default function ProfileOrganism() {
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const {
    data: profileData,
    loading: profileLoading,
    error: profileError,
  } = useQuery<GetUserProfileData>(GET_USER_PROFILE_QUERY);
  const [updateProfile, { loading: updateLoading }] = useMutation<UpdateProfileData, UpdateProfileVariables>(UPDATE_PROFILE_MUTATION);

  useEffect(() => {
    if (profileData?.getUserProfile) {
      const nextProfile = {
        ...profileData.getUserProfile,
        dob: normalizeDobForInput(profileData.getUserProfile.dob),
        profilePictureUrl: normalizeAvatarUrl(profileData.getUserProfile.profilePictureUrl),
      };

      setFormData(nextProfile);
      syncProfileIdentity({
        avatarUrl: nextProfile.profilePictureUrl,
        firstName: nextProfile.firstName,
        lastName: nextProfile.lastName,
        email: nextProfile.email,
      });
    }
  }, [profileData]);

  useEffect(() => {
    if (profileError) {
      setError(profileError.message || 'Unable to load profile');
    }
  }, [profileError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStatusMessage('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (attachments: UploadedAttachment[]) => {
    const [attachment] = attachments;

    if (!attachment) {
      return;
    }

    setError('');
    setStatusMessage('');

    try {
      const result = await updateProfile({
        variables: { profileId: attachment.id },
      });

      if (result.data?.updateProfile?.success) {
        setFormData((current) => ({
          ...current,
          profileId: attachment.id,
          profilePictureUrl: normalizeAvatarUrl(attachment.url),
        }));
        syncProfileIdentity({
          avatarUrl: normalizeAvatarUrl(attachment.url),
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
        });
        setStatusMessage(result.data.updateProfile.message || 'Profile photo updated successfully!');
      } else {
        setError(result.data?.updateProfile?.message || 'Failed to update profile photo');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating profile photo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');

    try {
      const updateData: UpdateProfileVariables = {
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        addressLine1: formData.addressLine1 || undefined,
        addressLine2: formData.addressLine2 || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        postalCode: formData.postalCode || undefined,
        country: formData.country || undefined,
        dob: formData.dob || undefined,
      };

      const result = await updateProfile({
        variables: updateData,
      });

      if (result.data?.updateProfile?.success) {
        setStatusMessage(result.data.updateProfile.message || 'Profile updated successfully!');
        syncProfileIdentity({
          avatarUrl: formData.profilePictureUrl,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
        });
      } else {
        setError(result.data?.updateProfile?.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <ProfileMolecule
      formData={formData}
      loading={profileLoading || updateLoading}
      error={error}
      statusMessage={statusMessage}
      profileLoaded={Boolean(profileData?.getUserProfile)}
      onAvatarUpload={handleAvatarUpload}
      onChange={handleChange}
      onSubmit={handleSubmit}
    />
  );
}
