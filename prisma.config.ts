/**
 * Prisma configuration file for Migrate and tooling.
 * Move connection URLs here (do NOT keep `url` in schema.prisma).
 * See: https://pris.ly/d/config-datasource
 */

const config = {
  datasources: {
    // Provide the connection string for Prisma Migrate
    db: process.env.DATABASE_URL,
  },
};

export default config;
