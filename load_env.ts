import path from "node:path";
import { fileURLToPath } from "node:url";
import * as dotenv from "dotenv";

// Resolve repo root regardless of /src or /dist execution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname,); // adjust if your src is deeper
const envFile = process.env.ENV_FILE || ".env";

const envPath = path.join(root, envFile);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn(`[env] Could not load ${envPath}: ${result.error.message}`);
} else {
  console.log(`[env] Loaded ${envPath}`);
}