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

  let envPath: string | null = null;
  if (process.env.ENV_FILE) {
    const customPath = path.join(root, process.env.ENV_FILE);
    envPath = fs.existsSync(customPath) ? customPath : null;
    if (!envPath) {
      console.warn(`[env] Missing ${customPath} (from ENV_FILE)`);
    }
  } else {
    const localPath = path.join(root, ".env.local");
    const defaultPath = path.join(root, ".env");
    envPath = fs.existsSync(localPath) ? localPath : (fs.existsSync(defaultPath) ? defaultPath : null);
  }

  if (envPath) {
    const result = dotenv.config({ path: envPath });
    if (result.error) {
      console.warn(`[env] Could not load ${envPath}: ${result.error.message}`);
    } else {
      console.log(`[env] Loaded ${envPath}`);
    }
  }
}
