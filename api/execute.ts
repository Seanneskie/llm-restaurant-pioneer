import "../load_env.js";
import { serve } from "@hono/node-server";
import app from "../server/server"; // Hono app

// Export default handler for Vercel (Node.js Runtime)
export default app.fetch;

// Local dev: run a server only when not on Vercel
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT) || 3000;
  serve({ fetch: app.fetch, port });
  console.log(`API running → http://localhost:${port}`);
}
