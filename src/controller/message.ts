import type { Context } from 'hono';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a new message
export const createMessage = async (c: Context) => {
  const body = await c.req.json();

  if (!body.content) {
    return c.json({ error: 'Content is required' }, 400);
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h from now

  const message = await prisma.message.create({
    data: {
      content: body.content, // should already be encrypted on client
      expiresAt,
    },
  });

  return c.json({ id: message.id });
};

// Retrieve and destroy the message (one-time read)
export const getMessage = async (c: Context) => {
  const id = c.req.param('id');

  const message = await prisma.message.findUnique({ where: { id } });

  if (!message || message.viewed || new Date() > message.expiresAt) {
    return c.json({ error: 'Message expired or not found' }, 404);
  }

  // Mark as viewed (self-destruct)
  await prisma.message.update({
    where: { id },
    data: { viewed: true },
  });

  return c.json({ content: message.content });
};
