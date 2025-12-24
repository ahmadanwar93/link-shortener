import { env } from "./config/env.js";

console.log("✅ Environment loaded successfully");
console.log(`   NODE_ENV: ${env.NODE_ENV}`);
console.log(`   PORT: ${env.PORT}`);
console.log(`   DATABASE_URL: ${env.DATABASE_URL.substring(0, 30)}...`);
