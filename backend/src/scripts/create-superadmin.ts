/**
 * Cria (ou atualiza a senha de) o superadmin da plataforma — o usuário que
 * cadastra novas arenas pelo painel.
 *
 * Uso: SUPERADMIN_EMAIL="..." SUPERADMIN_PASSWORD="..." SUPERADMIN_NAME="..." npm run superadmin:create
 *
 * A senha nunca é versionada: vem sempre por variável de ambiente.
 */
import { prisma } from '../config/prisma';
import { hashPassword } from '../utils/auth';
import { logger } from '../config/logger';
import { maskEmail } from '../utils/mask';

async function main() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  const name = process.env.SUPERADMIN_NAME ?? 'Superadmin';

  if (!email || !password) {
    throw new Error('SUPERADMIN_EMAIL e SUPERADMIN_PASSWORD são obrigatórios');
  }
  if (password.length < 8) {
    throw new Error('SUPERADMIN_PASSWORD deve ter ao menos 8 caracteres');
  }

  const passwordHash = await hashPassword(password);

  // Idempotente: rodar de novo só redefine a senha, sem duplicar usuário.
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'SUPERADMIN', active: true, arenaId: null },
    create: { name, email, passwordHash, role: 'SUPERADMIN', arenaId: null },
    select: { id: true, email: true },
  });

  logger.info('superadmin_upserted', { userId: user.id, email: maskEmail(user.email) });
  console.log(`Superadmin pronto: ${user.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
