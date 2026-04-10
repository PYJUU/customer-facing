import Link from "next/link";
import { PropsWithChildren } from "react";
import { auth, signOut } from "@/auth";

export async function AppShell({ children }: PropsWithChildren) {
  const session = await auth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold">AccessPilot</h1>
          <nav className="flex items-center gap-4 text-sm text-slate-600">
            <Link href="/">Dashboard</Link>
            <Link href="/sites">Sites</Link>
            <Link href="/sites/new">Add Site</Link>
            {!session?.user ? (
              <Link href="/login">Login</Link>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button className="text-slate-700" type="submit">
                  Logout
                </button>
              </form>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4">{children}</main>
    </div>
  );
}
