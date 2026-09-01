import Fastify from 'fastify';
import cors from '@fastify/cors';
import { auth } from './auth.js';
import { toNodeHandler } from 'better-auth/node';
import { taskRoutes } from './routes/tasks.js';
import { statsRoutes } from './routes/stats.js';
import 'dotenv/config';

const fastify = Fastify({
  logger: {
    level: 'info',
  },
});

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

// Register CORS for frontend client requests with credentials
await fastify.register(cors, {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
      return;
    }
    cb(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

const authHandler = toNodeHandler(auth);

// Mount Better Auth handler
fastify.all('/api/auth/*', async (request, reply) => {
  return authHandler(request.raw, reply.raw);
});

fastify.all('/api/auth', async (request, reply) => {
  return authHandler(request.raw, reply.raw);
});

// Mount domain routes
await fastify.register(taskRoutes);
await fastify.register(statsRoutes);

// Health check endpoint
fastify.get('/health', async () => {
  return { status: 'ok', service: 'dayzeros-api' };
});

const port = Number(process.env.PORT) || 4000;
const host = process.env.HOST || '0.0.0.0';

try {
  await fastify.listen({ port, host });
  console.log(`🌲 Dayzeros Fastify backend running on http://${host}:${port}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
