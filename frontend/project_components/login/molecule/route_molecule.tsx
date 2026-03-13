import React from "react";
import Input from "../../../components/Input";
import Button from "../../../components/Button";

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
    <div className="d-flex flex-column min-vh-100 bg-white">
      <main className="flex-grow-1 d-flex align-items-center justify-content-center">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-4">
              <div className="card shadow border-0">
                <div className="card-body">
                  <h1 className="mb-3 text-center login-title">Login</h1>

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

                    <Button type="submit" suppressHydrationWarning className="btn-animate w-100">
                      Login
                    </Button>
                  </form>

                  {error && <p className="text-danger mt-3 text-center">{error}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
