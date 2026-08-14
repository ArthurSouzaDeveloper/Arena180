import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verificarSenha } from "@/lib/senha";
import { loginSchema } from "@/lib/validation";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        senha: {},
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const usuario = await prisma.usuario.findUnique({
          where: { email: parsed.data.email },
        });
        if (!usuario) return null;

        const senhaValida = await verificarSenha(
          parsed.data.senha,
          usuario.senhaHash,
        );
        if (!senhaValida) return null;

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          tipo: usuario.tipo,
        };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.tipo = user.tipo;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.tipo = token.tipo as "BARBEARIA" | "BARBEIRO";
      }
      return session;
    },
  },
});
