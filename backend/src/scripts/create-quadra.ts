/**
 * Cria uma nova quadra (tenant) e seu usuário admin.
 * Uso: QUADRA_NAME="Arena Cillos" QUADRA_SLUG="arena-cillos" ADMIN_EMAIL="dono@arenacillos.com.br" ADMIN_PASSWORD="senha123" ADMIN_NAME="Fulano" npm run quadra:create
 */
import { prisma } from '../config/prisma';
import { hashPassword } from '../utils/auth';
import { logger } from '../config/logger';

async function main() {
  const name = process.env.QUADRA_NAME;
  const slug = process.env.QUADRA_SLUG;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME ?? 'Administrador';

  if (!name || !slug || !adminEmail || !adminPassword) {
    throw new Error('QUADRA_NAME, QUADRA_SLUG, ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórios');
  }

  const quadra = await prisma.quadra.create({ data: { name, slug } });

  const passwordHash = await hashPassword(adminPassword);
  const admin = await prisma.user.create({
    data: { name: adminName, email: adminEmail, passwordHash, role: 'ADMIN', quadraId: quadra.id },
  });

  logger.info('quadra_created', { quadraId: quadra.id, slug: quadra.slug, adminEmail: admin.email });
  console.log(`Quadra "${quadra.name}" criada. Login do admin: ${admin.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
