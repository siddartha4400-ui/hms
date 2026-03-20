'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { REQUEST_PASSWORD_RESET_MUTATION } from '../graphql/operations';
import ForgotPasswordMolecule from '../molecule/forgot-password-molecule';

interface RequestPasswordResetData {
  requestPasswordReset: {
    success: boolean;
    message: string;
  };
}

export default function ForgotPasswordOrganism() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [requestReset, { loading }] = useMutation<RequestPasswordResetData>(REQUEST_PASSWORD_RESET_MUTATION);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');

    try {
      const result = await requestReset({
        variables: { email },
      });

      if (result.data?.requestPasswordReset?.success) {
        setStatusMessage(result.data?.requestPasswordReset?.message || 'Reset link sent to your email');
        setSubmitted(true);
        setEmail('');
      } else {
        setError(result.data?.requestPasswordReset?.message || 'Failed to send reset link');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <ForgotPasswordMolecule
      email={email}
      loading={loading}
      error={error}
      statusMessage={statusMessage}
      submitted={submitted}
      onChange={(e) => setEmail(e.target.value)}
      onSubmit={handleSubmit}
    />
  );
}
