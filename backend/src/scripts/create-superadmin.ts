import bcrypt from "bcryptjs";
import { prisma } from "../config/database";

async function main() {
  const name = process.env.SUPERADMIN_NAME;
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!name || !email || !password) {
    console.error("Uso: SUPERADMIN_NAME=... SUPERADMIN_EMAIL=... SUPERADMIN_PASSWORD=... npm run superadmin:create");
    process.exit(1);
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.error(`Já existe um usuário com o e-mail "${email}".`);
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "SUPERADMIN",
      quadraId: null,
    },
  });

  console.log(`Superadmin "${name}" criado com sucesso.`);
  console.log(`E-mail: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
