// src/lib/db.ts
// Prisma client singleton — prevents multiple connections in development

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaOptions: any = {
  log:
    process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
};

export const db = globalForPrisma.prisma ?? new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export default db;
