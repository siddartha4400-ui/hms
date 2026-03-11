'use client';
import { useEffect, useState } from 'react';

type EnvData = {
  apiUrl?: string;
  otherVar?: string;
};

export default function SidduPage() {
  // Correct variable names
  const [env, setEnv] = useState<EnvData>({});
  const [loading, setLoading] = useState(true); // lowercase, no typos

  useEffect(() => {
    async function fetchEnv() {
      try {
        const res = await fetch('/api/env');
        const data: EnvData = await res.json();
        setEnv(data);
      } catch (err) {
        console.error('Failed to load env:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchEnv();
  }, []);

  if (loading) return <p>Loading environment variables...</p>;

  return (
    <div>
      <h1>Siddu Page</h1>
      <p>API URL: {env.apiUrl}</p>
    </div>
  );
}