'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { UPDATE_PROFILE_MUTATION, GET_USER_PROFILE_QUERY } from '../graphql/operations';
import ProfileMolecule from '../molecule/profile-molecule';

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

export default function ProfileOrganism() {
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

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
    setStatusMessage('');

    try {
      const updateData: any = {};
      const allowedFields = [
        'firstName',
        'lastName',
        'mobileNumber',
        'addressLine1',
        'addressLine2',
        'city',
        'state',
        'postalCode',
        'country',
        'dob',
      ];

      allowedFields.forEach((field) => {
        if (formData[field as keyof UserProfile] !== undefined) {
          updateData[field] = formData[field as keyof UserProfile];
        }
      });

      const result = await updateProfile({
        variables: updateData,
      });

      if (result.data?.updateProfile?.success) {
        setStatusMessage('Profile updated successfully!');
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
      onChange={handleChange}
      onSubmit={handleSubmit}
    />
  );
}
