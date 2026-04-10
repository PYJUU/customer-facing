"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { verifyTurnstileToken } from "@/lib/security/turnstile";

export type LoginState = {
  error?: string;
};

export async function authenticate(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const turnstileToken = String(formData.get("turnstileToken") ?? "");
  const turnstile = await verifyTurnstileToken(turnstileToken);
  if (!turnstile.ok) {
    return { error: "人机验证失败，请重试" };
  }

  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: String(formData.get("redirectTo") ?? "/sites"),
    });

    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "邮箱或密码错误" };
    }

    return { error: "登录失败，请稍后重试" };
  }
}
