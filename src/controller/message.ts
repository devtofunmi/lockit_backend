import type { Context } from 'hono';
import bcrypt from 'bcryptjs'; // Import bcrypt for hashing passwords
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
    : new Date(Date.now() + 24 * 60 * 60 * 1000);

  let passwordHash = null;
  if (body.password) {
    passwordHash = await bcrypt.hash(body.password, 10);
  }

  const message = await prisma.message.create({
    data: {
      content: body.content,
      key: body.key, // ✅ use client-side key
      expiresAt: expiration,
      selfDestruct: body.selfDestruct || false,
      passwordHash,
    },
  });

  return c.json({ id: message.id, key: message.key });
};



// Retrieve and destroy the message (one-time read)
// Retrieve and destroy the message (one-time read)
export const getMessage = async (c: Context) => {
  const id = c.req.param('id');
  const key = c.req.param('key'); // Get the key from the URL
  const password = c.req.query('password'); // Retrieve the password if provided

  const message = await prisma.message.findUnique({ where: { id } });

  if (!message || message.key !== key || message.viewed || new Date() > message.expiresAt) {
    return c.json({ error: 'Message expired, not found, or already viewed' }, 404);
  }

  // Check for password protection
  if (message.passwordHash && !password) {
    return c.json({ error: 'Password is required to view the message.' }, 403);
  }

  // If password protection is enabled, verify the password
  if (message.passwordHash && password) {
    const isPasswordValid = await bcrypt.compare(password, message.passwordHash);
    if (!isPasswordValid) {
      return c.json({ error: 'Invalid password.' }, 403);
    }
  }

  // Mark as viewed (self-destruct)
  await prisma.message.update({
    where: { id },
    data: { viewed: true },
  });

  if (message.selfDestruct) {
    // Automatically delete the message after it has been viewed
    await prisma.message.delete({
      where: { id },
    });
  }

  return c.json({ content: message.content });
};
