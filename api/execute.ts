import "../load_env";         
import { serve } from '@hono/node-server';
import app from '../server/server'; // where you `export default app`

const port = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port });
console.log(`API running → http://localhost:${port}`);
