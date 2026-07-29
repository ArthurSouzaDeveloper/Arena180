/**
 * Cria uma nova arena (tenant) e seu usuário admin.
 * Uso: ARENA_NAME="Arena Cillos" ARENA_SLUG="arena-cillos" ADMIN_EMAIL="dono@arenacillos.com.br" ADMIN_PASSWORD="senha123" ADMIN_NAME="Fulano" npm run arena:create
 *
 * Continua existindo para bootstrap/automação, mas o fluxo normal agora é o
 * painel de superadmin (POST /api/superadmin/arenas).
 */
import { prisma } from '../config/prisma';
import { hashPassword } from '../utils/auth';
import { logger } from '../config/logger';
import { maskEmail } from '../utils/mask';

async function main() {
  const name = process.env.ARENA_NAME;
  const slug = process.env.ARENA_SLUG;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME ?? 'Administrador';

  if (!name || !slug || !adminEmail || !adminPassword) {
    throw new Error('ARENA_NAME, ARENA_SLUG, ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórios');
  }

  const arena = await prisma.arena.create({ data: { name, slug } });

  const passwordHash = await hashPassword(adminPassword);
  const admin = await prisma.user.create({
    data: { name: adminName, email: adminEmail, passwordHash, role: 'ADMIN', arenaId: arena.id },
  });

  logger.info('arena_created', { arenaId: arena.id, slug: arena.slug, adminEmail: maskEmail(admin.email) });
  console.log(`Arena "${arena.name}" criada. Login do admin: ${admin.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
