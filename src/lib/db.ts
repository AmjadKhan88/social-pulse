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

if (process.env.PRISMA_ACCELERATE_URL) {
  prismaOptions.accelerateUrl = process.env.PRISMA_ACCELERATE_URL;
} else if (process.env.DATABASE_URL) {
  // For direct DB connections pass an adapter object with the URL
  prismaOptions.adapter = { url: process.env.DATABASE_URL };
}

export const db = globalForPrisma.prisma ?? new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export default db;
