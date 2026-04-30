// CommonJS fallback for Prisma CLI (avoids needing TS transpile)
module.exports = {
  datasources: {
    db: process.env.DATABASE_URL,
  },
};
