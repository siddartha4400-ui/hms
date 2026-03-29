'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client/react';
import { SIGNUP_MUTATION } from '../graphql/operations';
import SignupMolecule from '../molecule/route_molecule';

interface SignupData {
  signup?: {
    success: boolean;
    message?: string;
  };
}

export default function SignupOrganism() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    password: '',
    passwordConfirm: '',
  });
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const [signup, { loading }] = useMutation<SignupData>(SIGNUP_MUTATION);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');

    try {
      const result = await signup({
        variables: {
          email: formData.email,
          password: formData.password,
          passwordConfirm: formData.passwordConfirm,
          mobileNumber: formData.mobileNumber,
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
      });

      if (result.data?.signup?.success) {
        setStatusMessage(result.data.signup.message || 'Sign up successful! Please login to continue.');
        setTimeout(() => router.replace('/login'), 2000);
      } else {
        setError(result.data?.signup?.message || 'Sign up failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <SignupMolecule
      formData={formData}
      loading={loading}
      error={error}
      statusMessage={statusMessage}
      onChange={handleChange}
      onSubmit={handleSubmit}
    />
  );
}
