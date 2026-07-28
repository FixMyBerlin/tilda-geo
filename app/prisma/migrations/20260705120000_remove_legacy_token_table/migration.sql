-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_userId_fkey";

-- DropTable
DROP TABLE "Token";

-- DropEnum
DROP TYPE "TokenType";
