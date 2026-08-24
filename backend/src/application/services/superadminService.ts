import bcrypt from "bcryptjs";
import { prisma } from "../../config/database";
import { AppError, NotFoundError } from "../../domain/errors";

interface CreateArenaInput {
  name: string;
  slug: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

// Deliberately excludes mercadoPagoAccessToken / whatsappAccessToken: even
// encrypted, a superadmin listing that spans every tenant has no reason to
// ship that ciphertext to the client at all. The superadmin panel only ever
// renders these fields (frontend/src/pages/SuperadminPage.tsx).
const ARENA_SELECT = {
  id: true,
  name: true,
  slug: true,
  active: true,
  createdAt: true,
  users: { where: { role: "OWNER" as const }, select: { id: true, name: true, email: true } },
  _count: { select: { courts: true, rachas: true } },
};

export const superadminService = {
  async listArenas() {
    return prisma.quadra.findMany({
      orderBy: { createdAt: "desc" },
      select: ARENA_SELECT,
    });
  },

  async createArena({ name, slug, adminName, adminEmail, adminPassword }: CreateArenaInput) {
    const existingSlug = await prisma.quadra.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new AppError("Já existe uma arena com esse slug");
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingEmail) {
      throw new AppError("Já existe um usuário com esse e-mail");
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    return prisma.quadra.create({
      data: {
        name,
        slug,
        users: {
          create: {
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            role: "OWNER",
          },
        },
      },
      select: ARENA_SELECT,
    });
  },

  async setActive(id: string, active: boolean) {
    const quadra = await prisma.quadra.findUnique({ where: { id } });
    if (!quadra) {
      throw new NotFoundError("Arena não encontrada");
    }
    return prisma.quadra.update({ where: { id }, data: { active }, select: ARENA_SELECT });
  },
};
