'use client';

import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import {
  LOGIN_MUTATION,
  VERIFY_LOGIN_OTP_MUTATION,
} from '../graphql/operations';
import RouteMolecule from '../molecule/route_molecule';
import { clearStoredSession } from '@/lib/auth-token';

type LoginMethod = 'password' | 'email_otp' | 'whatsapp_otp';

export default function RouteOrganism() {
  const router = useRouter();
  const [error, setError] = useState('');

  const [loginMutation, { loading: loginLoading }] = useMutation(LOGIN_MUTATION);
  const [verifyOtpMutation, { loading: verifyLoading }] = useMutation(VERIFY_LOGIN_OTP_MUTATION);

  const handleLogin = async (
    method: LoginMethod,
    credentials: Record<string, string>,
  ): Promise<{ success: boolean; message?: string; token?: string; refreshToken?: string }> => {
    setError('');

    try {
      // ── Password login ─────────────────────────────────────────
      if (method === 'password') {
        const { data } = await loginMutation({
          variables: {
            method: 'password',
            email: credentials.email,
            password: credentials.password,
          },
        });

        const result = (data as any)?.login;
        if (result?.success && result?.token) {
          localStorage.setItem('authToken', result.token);
          if (result?.refreshToken) {
            localStorage.setItem('refreshToken', result.refreshToken);
          }
          router.replace('/dashboard');
          return { success: true, token: result.token, refreshToken: result?.refreshToken };
        }
        return { success: false, message: result?.message || 'Login failed' };
      }

      // ── OTP request (step 1) ────────────────────────────────────
      if (method === 'email_otp' || method === 'whatsapp_otp') {
        // No OTP yet → request one
        if (!credentials.otp) {
          const isEmail = method === 'email_otp';
          const { data } = await loginMutation({
            variables: {
              method,
              ...(isEmail
                ? { email: credentials.identifier }
                : { mobileNumber: credentials.identifier }),
            },
          });

          const result = (data as any)?.login;
          if (result?.success) {
            return { success: true, message: result.message || 'OTP sent' };
          }
          return { success: false, message: result?.message || 'Failed to send OTP' };
        }

        // ── OTP verify (step 2) ───────────────────────────────────
        const otpType = method === 'email_otp' ? 'email' : 'whatsapp';
        const { data } = await verifyOtpMutation({
          variables: {
            identifier: credentials.identifier,
            otp: credentials.otp,
            otpType,
          },
        });

        const result = (data as any)?.verifyLoginOtp;
        if (result?.success && result?.token) {
          localStorage.setItem('authToken', result.token);
          if (result?.refreshToken) {
            localStorage.setItem('refreshToken', result.refreshToken);
          }
          router.replace('/dashboard');
          return { success: true, token: result.token, refreshToken: result?.refreshToken };
        }
        return { success: false, message: result?.message || 'OTP verification failed' };
      }

      return { success: false, message: 'Unknown login method' };
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      const isExpiredJwtError = /signature has expired|jwt expired/i.test(rawMessage);
      if (isExpiredJwtError) {
        clearStoredSession();
      }

      const errorMsg = isExpiredJwtError
        ? 'Session expired. Please log in again.'
        : rawMessage;
      setError(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  return (
    <RouteMolecule
      onLogin={handleLogin}
      onError={setError}
      error={error}
      loading={loginLoading || verifyLoading}
    />
  );
}

