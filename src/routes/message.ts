// /routes/messageRoutes.ts
import { Hono } from 'hono';
import { createMessage, getMessage } from '../controller/message.js';


const messageRoutes = (app: Hono) => {
  // POST route to create a message
  app.post('/messages', async (c) => {
    try {
      const { message, expirationMinutes, burnAfterReading, password } = await c.req.json();

      const newMessage = await createMessage(message, expirationMinutes, burnAfterReading, password);

      return c.json({ id: newMessage.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      return c.json({ error: errorMessage }, 500);
    }
  });

  // GET route to fetch a message by id
  app.get('/messages/:id', async (c) => {
    try {
      const { id } = c.req.param();
      const { password } = await c.req.json(); // Assume the user provides a password to decrypt

      const decryptedMessage = await getMessage(id, password);

      return c.json({ message: decryptedMessage });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      return c.json({ error: errorMessage }, 404);
    }
  });
};

export { messageRoutes };

