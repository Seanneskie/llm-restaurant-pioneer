import path from "node:path";
import { fileURLToPath } from "node:url";
import * as dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Only load .env locally – Vercel already injects env vars
if (process.env.NODE_ENV !== "production") {
  const root = path.resolve(__dirname, ".."); // adjust if deeper
  const envFile = process.env.ENV_FILE || ".env";
  const envPath = path.join(root, envFile);

  const result = dotenv.config({ path: envPath });

  if (result.error) {
    console.warn(`[env] Could not load ${envPath}: ${result.error.message}`);
  } else {
    console.log(`[env] Loaded ${envPath}`);
  }
}
