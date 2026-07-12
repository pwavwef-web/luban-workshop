"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/admin/AuthProvider";

export default function LoginPage() {
  const { status, error, signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "admin") router.replace("/");
  }, [router, status]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setLocalError("");
    try {
      await signIn(email, password);
    } catch (signInError) {
      setLocalError(signInError instanceof Error ? signInError.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="brand-mark login-mark">LW</div>
        <p className="eyebrow">Luban Workshop</p>
        <h1>Admin sign in</h1>
        <p className="muted">Access is limited to Firebase admins with an admin claim or a matching Firestore admin record.</p>
        <form onSubmit={submit} className="form-stack">
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required />
          </label>
          {error || localError ? <p className="form-error">{error || localError}</p> : null}
          <button className="btn btn-primary" disabled={busy || status === "checking"} type="submit">
            {busy ? "Signing in..." : "Sign in"}
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => signInWithGoogle()} disabled={busy || status === "checking"}>
            Continue with Google
          </button>
        </form>
      </section>
    </main>
  );
}
