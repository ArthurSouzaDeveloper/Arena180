-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'SUPERADMIN');

-- AlterTable
ALTER TABLE "quadras" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'OWNER',
ALTER COLUMN "quadra_id" DROP NOT NULL;
