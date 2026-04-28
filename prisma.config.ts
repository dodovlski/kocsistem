import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"]!,
    // @ts-expect-error — Prisma CLI reads directUrl from config, but types don't expose it yet
    directUrl: process.env["DIRECT_URL"],
  },
});
