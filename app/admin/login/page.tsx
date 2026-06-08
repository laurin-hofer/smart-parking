"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CarFront, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      if (!response.ok) {
        setError("Incorrect password. Please try again.");
        return;
      }
      const redirect = searchParams.get("redirect") ?? "/admin";
      window.location.href = redirect;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-glow">
          <CarFront className="h-7 w-7" />
        </span>
        <h1 className="text-2xl font-semibold text-white">Admin Login</h1>
        <p className="text-sm text-slate-400">Smart Parking — restricted area</p>
      </div>

      <div className="glass rounded-2xl p-6">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                type="password"
                className="pl-9"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        For regular parking, use the{" "}
        <a href="/user" className="text-indigo-400 hover:underline">
          User Dashboard
        </a>
      </p>
    </div>
  );
}

export default function AdminLogin() {
  return (
    <main className="min-h-screen soft-grid flex items-center justify-center px-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
