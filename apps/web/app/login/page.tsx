import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { verifyTurnstileToken } from "@/lib/security/turnstile";

async function authenticate(formData: FormData) {
  "use server";

  const turnstileToken = String(formData.get("turnstileToken") ?? "");
  const turnstile = await verifyTurnstileToken(turnstileToken);
  if (!turnstile.ok) {
    throw new Error("人机验证失败，请重试");
  }

  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/sites",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      throw new Error("邮箱或密码错误");
    }

    throw error;
  }
}

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">登录 AccessPilot</h2>
      <form action={authenticate} className="space-y-4">
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

        <TurnstileWidget />

        <button
          type="submit"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white"
        >
          登录
        </button>
      </form>
    </section>
  );
}
