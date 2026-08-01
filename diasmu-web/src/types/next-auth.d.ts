import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    nbm?: string;
    phone?: string;
    nomor_wa?: string;
  }

  interface Session {
    user?: DefaultSession["user"] & {
      nbm?: string;
      phone?: string;
      nomor_wa?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    nbm?: string;
  }
}
