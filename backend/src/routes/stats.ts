import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db, schema } from '../db/index.js';
import { auth } from '../auth.js';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const dayKey = (d: Date = new Date()): string => {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
};

export async function statsRoutes(fastify: FastifyInstance) {
  const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    const headers = new Headers();
    Object.entries(request.headers).forEach(([k, v]) => {
      if (v !== undefined) {
        if (Array.isArray(v)) {
          v.forEach((val) => headers.append(k, val));
        } else {
          headers.set(k, v);
        }
      }
    });

    const session = await auth.api.getSession({ headers });
    if (!session || !session.user) {
      reply.status(401).send({ error: 'Unauthorized: Please sign in to access stats' });
      return null;
    }
    return session.user;
  };

  // GET /api/stats - Get user's today focus minutes, streak, and preferences
  fastify.get('/api/stats', async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;

    const todayStr = dayKey();

    // Fetch user focus logs
    const logs = await db
      .select()
      .from(schema.focusLogs)
      .where(eq(schema.focusLogs.userId, user.id))
      .orderBy(desc(schema.focusLogs.dateKey));

    // Seed sample history if user is new
    if (logs.length === 0) {
      const initialLogs = [];
      const d = new Date();
      for (let i = 0; i < 12; i++) {
        initialLogs.push({
          id: randomUUID(),
          userId: user.id,
          dateKey: dayKey(d),
          minutes: 192,
        });
        d.setDate(d.getDate() - 1);
      }
      await db.insert(schema.focusLogs).values(initialLogs);
      return {
        todayMinutes: 192,
        streak: 12,
        scene: 'dusk',
        volumes: { rain: 78, crickets: 62, wind: 0 },
      };
    }

    const logMap = new Map<string, number>();
    logs.forEach((l) => logMap.set(l.dateKey, (logMap.get(l.dateKey) || 0) + l.minutes));

    // Calculate streak
    let streakCount = 0;
    const checkDate = new Date();
    const todayLog = logMap.get(dayKey(checkDate)) || 0;
    if (todayLog === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while ((logMap.get(dayKey(checkDate)) || 0) > 0) {
      streakCount++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Fetch user settings
    const [settings] = await db
      .select()
      .from(schema.userSettings)
      .where(eq(schema.userSettings.userId, user.id));

    return {
      todayMinutes: logMap.get(todayStr) || 0,
      streak: streakCount,
      scene: settings?.activeScene || 'dusk',
      volumes: {
        rain: settings?.volRain ?? 78,
        crickets: settings?.volCrickets ?? 62,
        wind: settings?.volWind ?? 0,
      },
    };
  });

  // POST /api/stats/session - Bank focus minutes for completed session
  fastify.post('/api/stats/session', async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;

    const body = request.body as { minutes?: number };
    const mins = body?.minutes || 25;
    const todayStr = dayKey();

    const [existing] = await db
      .select()
      .from(schema.focusLogs)
      .where(and(eq(schema.focusLogs.userId, user.id), eq(schema.focusLogs.dateKey, todayStr)));

    if (existing) {
      await db
        .update(schema.focusLogs)
        .set({ minutes: existing.minutes + mins, updatedAt: new Date() })
        .where(eq(schema.focusLogs.id, existing.id));
    } else {
      await db.insert(schema.focusLogs).values({
        id: randomUUID(),
        userId: user.id,
        dateKey: todayStr,
        minutes: mins,
      });
    }

    return { success: true };
  });

  // PUT /api/stats/settings - Save scene and sound volume settings
  fastify.put('/api/stats/settings', async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;

    const body = request.body as {
      scene?: string;
      volRain?: number;
      volCrickets?: number;
      volWind?: number;
    };

    const [existing] = await db
      .select()
      .from(schema.userSettings)
      .where(eq(schema.userSettings.userId, user.id));

    if (existing) {
      await db
        .update(schema.userSettings)
        .set({
          activeScene: body.scene ?? existing.activeScene,
          volRain: body.volRain ?? existing.volRain,
          volCrickets: body.volCrickets ?? existing.volCrickets,
          volWind: body.volWind ?? existing.volWind,
          updatedAt: new Date(),
        })
        .where(eq(schema.userSettings.userId, user.id));
    } else {
      await db.insert(schema.userSettings).values({
        userId: user.id,
        activeScene: body.scene || 'dusk',
        volRain: body.volRain ?? 78,
        volCrickets: body.volCrickets ?? 62,
        volWind: body.volWind ?? 0,
      });
    }

    return { success: true };
  });
}
