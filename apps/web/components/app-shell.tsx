import Link from "next/link";
import { PropsWithChildren } from "react";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold">AccessPilot</h1>
          <nav className="flex gap-4 text-sm text-slate-600">
            <Link href="/">Dashboard</Link>
            <Link href="/sites">Sites</Link>
            <Link href="/sites/new">Add Site</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4">{children}</main>
    </div>
  );
}
