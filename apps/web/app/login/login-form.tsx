"use client";

import { useActionState } from "react";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { authenticate, type LoginState } from "@/app/login/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    authenticate,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm">邮箱</span>
        <input
          name="email"
          type="email"
          className="w-full rounded-md border p-2"
          required
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm">密码</span>
        <input
          name="password"
          type="password"
          className="w-full rounded-md border p-2"
          required
          minLength={6}
        />
      </label>

      <input type="hidden" name="redirectTo" value="/sites" />
      <TurnstileWidget />

      {state.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}

      <button
        type="submit"
        className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-70"
        disabled={pending}
      >
        {pending ? "登录中..." : "登录"}
      </button>
    </form>
  );
}
