/// <reference types="node" />
// include this to tell TS where to find Node.js types to remove the process type error
// basically we want to "load `@types/node` for this file" without requiring the file to be part of your main compilation.
import { defineConfig } from "drizzle-kit";

// drizzle kit is is similar to artisan where it is a cli tool for framework operation
// but artisan is for the entire framework, drizzle kit is only for database schema management
export default defineConfig({
  schema: "./src/db/schema.ts", // like database.php _ models
  out: "./drizzle", // like database/migrations
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
// equivalent to laravel config/database.php
