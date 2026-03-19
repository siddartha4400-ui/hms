'use client';

import { useEffect, useState } from 'react';
import { gql } from '@apollo/client';
import client from '@/lib/apollo';
import { useRouter } from 'next/navigation';

type MeData = {
  me: string;
};

export default function ProfilePage() {
  const [data, setData] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    async function fetchData() {
              const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login'); // redirect if not logged in
        return;
      }

      try {
        const result = await client.query<MeData>({
          query: gql`
            query {
              me 
            }
          `,
        });
        if (result.data) {
           setData(result.data);
        }
      } catch (err) {
        console.error('GraphQL query error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  if (loading) return <p>Loading...</p>;
  if (!data) return <p>No data found</p>;

  return (
    <div>
      <h1>User Info</h1>
      <p>ID: {data.me}</p>
    </div>
  );
}