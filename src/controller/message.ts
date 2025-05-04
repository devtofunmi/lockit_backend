import type { Context } from 'hono';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a new message
export const createMessage = async (c: Context) => {
  const body = await c.req.json();

  if (!body.content || !body.key) {
    return c.json({ error: 'Content and key are required' }, 400);
  }

  const expiration = body.expiration
    ? new Date(body.expiration)
    : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24h

  let passwordHash = null;
  if (body.password) {
    passwordHash = await bcrypt.hash(body.password, 10);
  }

  const message = await prisma.message.create({
    data: {
      content: body.content, // Should be already encrypted
      key: body.key,
      expiresAt: expiration,
      selfDestruct: body.selfDestruct || false,
      passwordHash,
      viewed: false,
    },
  });

  return c.json({ id: message.id });
};

// Retrieve and destroy the message (one-time read)
export const getMessage = async (c: Context) => {
  const id = c.req.param('id');
  const key = c.req.param('key');
  const password = c.req.query('password');

  const message = await prisma.message.findUnique({ where: { id } });

  if (
    !message ||
    message.key !== key ||
    message.viewed ||
    new Date() > message.expiresAt
  ) {
    return c.json({ error: 'Message expired, not found, or already viewed' }, 404);
  }

  if (message.passwordHash && !password) {
    return c.json({ error: 'Password is required to view the message.' }, 403);
  }

  if (message.passwordHash && password) {
    const isPasswordValid = await bcrypt.compare(password, message.passwordHash);
    if (!isPasswordValid) {
      return c.json({ error: 'Invalid password.' }, 403);
    }
  }

  await prisma.message.update({
    where: { id },
    data: { viewed: true },
  });

  if (message.selfDestruct) {
    await prisma.message.delete({ where: { id } });
  }

  return c.json({ content: message.content });
};
