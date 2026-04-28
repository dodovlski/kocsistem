"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "@/server/actions/auth";

type Action = (prev: AuthState, fd: FormData) => Promise<AuthState>;

export function AuthForm({
  action,
  mode,
}: {
  action: Action;
  mode: "login" | "register";
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    undefined,
  );
  const isRegister = mode === "register";

  return (
    <form
      action={formAction}
      className="rounded-sm border border-brand-border bg-white p-8 shadow-sm space-y-5"
    >
      <div className="space-y-1">
        <div className="h-1 w-10 bg-brand-red" />
        <h1 className="text-2xl font-bold tracking-tight text-brand-dark">
          {isRegister ? "Create Account" : "Sign In"}
        </h1>
      </div>

      {isRegister && (
        <Field
          id="name"
          name="name"
          label="Name (optional)"
          type="text"
          autoComplete="name"
        />
      )}
      <Field
        id="email"
        name="email"
        label="Email"
        type="email"
        required
        autoComplete="email"
      />
      <Field
        id="password"
        name="password"
        label="Password"
        type="password"
        required
        minLength={8}
        autoComplete={isRegister ? "new-password" : "current-password"}
      />

      {state?.error && (
        <p className="text-sm text-brand-red" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-sm bg-brand-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-red-hover disabled:opacity-50 transition-colors"
      >
        {pending
          ? "Please wait..."
          : isRegister
            ? "Sign Up"
            : "Sign In"}
      </button>

      <p className="text-sm text-brand-muted text-center">
        {isRegister ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand-dark underline">
              Sign In
            </Link>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-brand-dark underline"
            >
              Sign Up
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  ...props
}: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-wide text-brand-muted"
      >
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="w-full rounded-sm border border-brand-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-red/20"
      />
    </div>
  );
}
