import path from "node:path";
import { fileURLToPath } from "node:url";
import * as dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root in dev (ts-node) and from ../ in dist
const base = path.basename(__dirname) === "dist" ? path.dirname(__dirname) : __dirname;
const root = path.resolve(base);
const envFile = process.env.ENV_FILE || ".env";
const envPath = path.join(root, envFile);

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.warn(`[env] Could not load ${envPath}: ${result.error.message}`);
} else {
  console.log(`[env] Loaded ${envPath}`);
}
