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

export const superadminService = {
  async listArenas() {
    return prisma.quadra.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        users: { where: { role: "OWNER" }, select: { id: true, name: true, email: true } },
        _count: { select: { courts: true, rachas: true } },
      },
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

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

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
      include: { users: { select: { id: true, name: true, email: true, role: true } } },
    });
  },

  async setActive(id: string, active: boolean) {
    const quadra = await prisma.quadra.findUnique({ where: { id } });
    if (!quadra) {
      throw new NotFoundError("Arena não encontrada");
    }
    return prisma.quadra.update({ where: { id }, data: { active } });
  },
};
