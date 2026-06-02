import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "../prisma/schema.prisma",
  datasource: {
    // Fall back to a placeholder so `prisma generate` works during builds/CI
    // where no database is provisioned. Runtime and migrations use the real
    // DATABASE_URL from the environment (e.g. Render, local .env).
    url: process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
