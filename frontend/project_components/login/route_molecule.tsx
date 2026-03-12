import React from "react";
import Input from "../../components/Input";
import Button from "../../components/Button";

type Props = {
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  error: string;
  handleLogin: (e: React.FormEvent) => void;
};

export default function RouteMolecule({ username, setUsername, password, setPassword, error, handleLogin }: Props) {
  return (
    <div>
      <h1 className="mb-3 login-title">Login</h1>

      <form onSubmit={handleLogin} className="d-flex flex-column gap-3">
        <Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername((e.target as HTMLInputElement).value)}
          required
          suppressHydrationWarning
          className="input-animate"
        />

        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
          required
          suppressHydrationWarning
          className="input-animate"
        />

        <Button type="submit" suppressHydrationWarning className="btn-animate">
          Login
        </Button>
      </form>

      {error && <p className="text-danger mt-3">{error}</p>}
    </div>
  );
}
