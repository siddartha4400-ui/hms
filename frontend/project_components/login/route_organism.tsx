"use client";

import { useState } from "react";
import { gql } from "@apollo/client";
import client from "@/lib/apollo";
import { useRouter } from "next/navigation";
import RouteMolecule from "./route_molecule";

const LOGIN_MUTATION = gql`
  mutation login($username: String!, $password: String!) {
    tokenAuth(username: $username, password: $password) {
      token
    }
  }
`;

type LoginResult = {
  tokenAuth: {
    token: string;
  };
};

export default function RouteOrganism() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await client.mutate<LoginResult>({
        mutation: LOGIN_MUTATION,
        variables: { username, password },
      });

      const token = result.data?.tokenAuth?.token;
      if (token) {
        localStorage.setItem("token", token);
        router.push("/siddu");
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      // Improve visibility for GraphQL errors (CombinedGraphQLErrors)
      // err (ApolloError) often contains graphQLErrors and networkError
      // Show first graphQLError message to the user when available
      // and log the entire error for debugging.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyErr: any = err;
      console.error("Login error (full):", anyErr);

      if (anyErr?.graphQLErrors && anyErr.graphQLErrors.length > 0) {
        // Combine messages (sometimes there are multiple errors)
        const messages = anyErr.graphQLErrors.map((g: any) => g.message).join("; ");
        setError(messages);
      } else if (anyErr?.networkError) {
        setError(`Network error: ${anyErr.networkError.message || "unknown"}`);
      } else if (anyErr?.message) {
        setError(anyErr.message);
      } else {
        setError("Login failed. Please check your username and password.");
      }
    }
  };

  return (
    <RouteMolecule
      username={username}
      setUsername={setUsername}
      password={password}
      setPassword={setPassword}
      error={error}
      handleLogin={handleLogin}
    />
  );
}
