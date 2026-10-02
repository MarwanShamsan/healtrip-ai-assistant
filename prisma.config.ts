import {
  config,
} from "dotenv";

import {
  defineConfig,
} from "prisma/config";

/*
 * Load the local development environment.
 *
 * override: true is intentional because on
 * Windows an existing system DATABASE_URL
 * could otherwise override .env.local.
 */
config({
  path:
    ".env.local",

  override:
    true,
});

export default defineConfig({
  schema:
    "prisma/schema.prisma",

  migrations: {
    path:
      "prisma/migrations",

    seed:
      "tsx prisma/seed.ts",
  },

  /*
   * Prisma CLI connection.
   *
   * Prisma 7 expects datasource.url here.
   *
   * DIRECT_URL should be the non-pooled Neon
   * connection and is used for commands such as:
   *
   * prisma db push
   * prisma migrate ...
   */
  datasource: {
    url:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      "",
  },
});