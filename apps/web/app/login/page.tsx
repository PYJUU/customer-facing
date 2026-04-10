import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">登录 AccessPilot</h2>
      <LoginForm />
    </section>
  );
}
