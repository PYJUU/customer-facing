import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const pathname = request.nextUrl.pathname;

      if (pathname.startsWith("/api/auth")) {
        return true;
      }

      if (
        pathname.startsWith("/sites") ||
        pathname.startsWith("/api/sites") ||
        pathname.startsWith("/api/scans")
      ) {
        return isLoggedIn;
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
