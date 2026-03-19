"use client";

import { useState } from "react";
import { gql } from "@apollo/client";
import client from "@/lib/apollo";
import { useRouter } from "next/navigation";
import RouteMolecule from "../molecule/route_molecule";

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

    // Magic Bypass for demonstration purposes
    if (username.toLowerCase() === "admin" && password === "admin") {
      localStorage.setItem("token", "hotel-demo-token");
      router.push("/dashboard");
      return;
    }

    try {
      const result = await client.mutate<LoginResult>({
        mutation: LOGIN_MUTATION,
        variables: { username, password },
      });

      const token = result.data?.tokenAuth?.token;
      if (token) {
        localStorage.setItem("token", token);
        router.push("/dashboard");
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const messages = anyErr.graphQLErrors.map((g: any) => g.message).join("; ");
        setError(messages);
      } else if (anyErr?.networkError) {
        setError(`Unable to connect to the Platform Server. (${anyErr.networkError.statusCode || anyErr.networkError.message || "404"})`);
      } else if (anyErr?.message) {
        setError(anyErr.message);
      } else {
        setError("Login failed. Please check your credentials.");
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
