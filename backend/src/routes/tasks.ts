import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db, schema } from '../db/index.js';
import { auth } from '../auth.js';
import { eq, and, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function taskRoutes(fastify: FastifyInstance) {
  // Authentication hook for all task routes
  const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    // Convert Fastify headers to standard Headers object for Better Auth
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
      reply.status(401).send({ error: 'Unauthorized: Please sign in to manage tasks' });
      return null;
    }
    return session.user;
  };

  // GET /api/tasks - Retrieve all tasks for current user
  fastify.get('/api/tasks', async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;

    const userTasks = await db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.userId, user.id))
      .orderBy(asc(schema.tasks.order), asc(schema.tasks.createdAt));

    // If first visit and user has no tasks, seed default initial tasks
    if (userTasks.length === 0) {
      const defaultTasks = [
        { id: randomUUID(), userId: user.id, text: 'Clear inbox to zero', done: true, order: 0 },
        { id: randomUUID(), userId: user.id, text: 'Draft Q4 roadmap', done: false, order: 1 },
        { id: randomUUID(), userId: user.id, text: "Review Maya's PR", done: false, order: 2 },
        { id: randomUUID(), userId: user.id, text: 'Book dentist', done: false, order: 3 },
      ];
      await db.insert(schema.tasks).values(defaultTasks);
      return defaultTasks.map((t) => ({ id: t.id, t: t.text, done: t.done }));
    }

    return userTasks.map((t) => ({ id: t.id, t: t.text, done: t.done }));
  });

  // POST /api/tasks - Create new task
  fastify.post('/api/tasks', async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;

    const body = request.body as { t: string };
    if (!body || !body.t || typeof body.t !== 'string') {
      return reply.status(400).send({ error: 'Task text is required' });
    }

    const newTask = {
      id: randomUUID(),
      userId: user.id,
      text: body.t.trim(),
      done: false,
      order: Date.now(),
    };

    await db.insert(schema.tasks).values(newTask);
    return { id: newTask.id, t: newTask.text, done: newTask.done };
  });

  // PUT /api/tasks/:id - Update task (toggle done or edit text)
  fastify.put('/api/tasks/:id', async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };
    const body = request.body as { t?: string; done?: boolean };

    const updateData: Partial<typeof schema.tasks.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.t !== undefined) updateData.text = body.t;
    if (body.done !== undefined) updateData.done = body.done;

    await db
      .update(schema.tasks)
      .set(updateData)
      .where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, user.id)));

    return { success: true };
  });

  // DELETE /api/tasks/:id - Delete a task
  fastify.delete('/api/tasks/:id', async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };

    await db
      .delete(schema.tasks)
      .where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, user.id)));

    return { success: true };
  });
}
