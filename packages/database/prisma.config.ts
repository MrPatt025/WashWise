import path from "node:path";
import { defineConfig } from "prisma/config";
import "dotenv/config";

// Load DATABASE_URL from environment or use default for development
const databaseUrl =
  process.env.DATABASE_URL || "postgresql://washwise:washwise@localhost:5432/washwise";

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),

  migrations: {
    async url() {
      return databaseUrl;
    },
    seed: "npx tsx prisma/seed.ts",
  },

  // Required for prisma migrate deploy
  datasource: {
    url: databaseUrl,
  },
});
