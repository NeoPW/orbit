import { handleApi } from './api.ts';
import { createD1Driver } from './d1-driver.ts';

interface WorkerEnv extends Env {
  /** Secret: comma-separated `name=token` pairs, one per device. */
  DEVICE_TOKENS?: string;
}

export default {
  async fetch(request, env): Promise<Response> {
    // Only /api/* reaches the Worker (wrangler.jsonc run_worker_first); the rest is the browser build.
    if (new URL(request.url).pathname.startsWith('/api/')) {
      return handleApi(request, { driver: createD1Driver(env.DB), deviceTokens: env.DEVICE_TOKENS });
    }
    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<WorkerEnv>;
