import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { UnauthorizedError } from "../../domain/errors";

interface LoginInput {
  email: string;
  password: string;
}

export const authService = {
  async login({ email, password }: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { quadra: true },
    });

    if (!user) {
      throw new UnauthorizedError("E-mail ou senha inválidos");
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedError("E-mail ou senha inválidos");
    }

    const token = jwt.sign({ userId: user.id, quadraId: user.quadraId }, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn,
    } as jwt.SignOptions);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      quadra: {
        id: user.quadra.id,
        name: user.quadra.name,
        slug: user.quadra.slug,
      },
    };
  },

  async me(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { quadra: true },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      quadra: {
        id: user.quadra.id,
        name: user.quadra.name,
        slug: user.quadra.slug,
      },
    };
  },
};
