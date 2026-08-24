import bcrypt from "bcryptjs";
import { prisma } from "../config/database";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const quadraName = process.env.QUADRA_NAME;
  const quadraSlug = process.env.QUADRA_SLUG ?? (quadraName ? slugify(quadraName) : undefined);
  const adminName = process.env.ADMIN_NAME;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!quadraName || !quadraSlug || !adminName || !adminEmail || !adminPassword) {
    console.error(
      "Uso: QUADRA_NAME=... QUADRA_SLUG=... ADMIN_NAME=... ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run quadra:create",
    );
    process.exit(1);
  }

  const existingQuadra = await prisma.quadra.findUnique({ where: { slug: quadraSlug } });
  if (existingQuadra) {
    console.error(`Já existe uma quadra com o slug "${quadraSlug}".`);
    process.exit(1);
  }

  const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existingUser) {
    console.error(`Já existe um usuário com o e-mail "${adminEmail}".`);
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const quadra = await prisma.quadra.create({
    data: {
      name: quadraName,
      slug: quadraSlug,
      users: {
        create: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
        },
      },
    },
    include: { users: true },
  });

  console.log(`Quadra "${quadra.name}" criada com sucesso.`);
  console.log(`Admin: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
