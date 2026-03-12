import React from "react";

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
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          suppressHydrationWarning
          className="form-control input-animate"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          suppressHydrationWarning
          className="form-control input-animate"
        />

        <button type="submit" suppressHydrationWarning className="btn btn-primary btn-animate">
          Login
        </button>
      </form>

      {error && <p className="text-danger mt-3">{error}</p>}
    </div>
  );
}
