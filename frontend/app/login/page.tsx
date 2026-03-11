'use client';

import { useState } from 'react';
import { gql } from '@apollo/client';
import client from '@/lib/apollo';
import { useRouter } from 'next/navigation';

// GraphQL login mutation (camelCase)
const LOGIN_MUTATION = gql`
  mutation login($username: String!, $password: String!) {
    tokenAuth(username: $username, password: $password) {
      token
    }
  }
`;

// TypeScript type for the mutation result
type LoginResult = {
  tokenAuth: {
    token: string;
  };
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await client.mutate<LoginResult>({
        mutation: LOGIN_MUTATION,
        variables: { username, password },
      });

      // Get JWT from the response
      const token = result.data?.tokenAuth?.token;
      if (token) {
        localStorage.setItem('token', token); // store JWT
        router.push('/siddu'); // redirect to protected page
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please check your username and password.');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h1>Login</h1>
      <form
        onSubmit={handleLogin}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}