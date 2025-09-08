import path from "node:path";
import { fileURLToPath } from "node:url";
import * as dotenv from "dotenv";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Only load from a file in local/dev. In production (Vercel/Lambda/etc.),
// rely on platform-provided env and avoid warnings about missing /var/task/.env.
const isProd = process.env.NODE_ENV === "production" || !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

if (!isProd) {
  // Load .env from project root in dev (ts-node) and from ../ in dist
  const base = path.basename(__dirname) === "dist" ? path.dirname(__dirname) : __dirname;
  const root = path.resolve(base);
  const envFile = process.env.ENV_FILE || ".env";
  const envPath = path.join(root, envFile);

  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (result.error) {
      console.warn(`[env] Could not load ${envPath}: ${result.error.message}`);
    } else {
      console.log(`[env] Loaded ${envPath}`);
    }
  } else {
    // Silent when missing in dev unless explicitly set via ENV_FILE
    if (process.env.ENV_FILE) {
      console.warn(`[env] Missing ${envPath} (from ENV_FILE)`);
    }
  }
}
