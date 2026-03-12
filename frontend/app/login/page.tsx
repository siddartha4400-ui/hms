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

import RouteOrganism from "../../project_components/login/route_organism";

export default function Page() {
  return <RouteOrganism />;
}