import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    tipo: "BARBEARIA" | "BARBEIRO";
  }

  interface Session {
    user: {
      id: string;
      tipo: "BARBEARIA" | "BARBEIRO";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tipo: "BARBEARIA" | "BARBEIRO";
  }
}
