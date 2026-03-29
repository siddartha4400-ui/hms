'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client/react';
import { RESET_PASSWORD_MUTATION } from '../graphql/operations';
import ResetPasswordMolecule from '../molecule/reset-password-molecule';

interface ResetPasswordData {
  resetPassword: {
    success: boolean;
    message: string;
  };
}

export default function ResetPasswordOrganism() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [formData, setFormData] = useState({
    password: '',
    passwordConfirm: '',
  });
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const [resetPassword, { loading }] = useMutation<ResetPasswordData>(RESET_PASSWORD_MUTATION);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');

    if (!token) {
      setError('Invalid reset link');
      return;
    }

    try {
      const result = await resetPassword({
        variables: {
          token,
          password: formData.password,
          passwordConfirm: formData.passwordConfirm,
        },
      });

      if (result.data?.resetPassword?.success) {
        setStatusMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
      } else {
        setError(result.data?.resetPassword?.message || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <ResetPasswordMolecule
      formData={formData}
      loading={loading}
      error={error}
      statusMessage={statusMessage}
      hasValidToken={!!token}
      onChange={handleChange}
      onSubmit={handleSubmit}
    />
  );
}
