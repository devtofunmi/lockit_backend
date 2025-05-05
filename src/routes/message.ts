import { Hono } from 'hono';
import { createMessage, getMessage } from '../controller/message.js';

const messageRoutes = (app: Hono) => {
  // POST route to create a message
  app.post('/messages', async (c) => {
    try {
      // Get the request data (message, expirationMinutes, burnAfterReading, password)
      const { content, expirationMinutes, burnAfterReading, password } = await c.req.json();

      // Call the createMessage function with proper parameters
      const newMessage = await createMessage(content, expirationMinutes, burnAfterReading, password);

      // Return the message ID in the response
      return c.json({ id: newMessage.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      return c.json({ error: errorMessage }, 500);
    }
  });

  // GET route to fetch a message by ID
  app.get('/messages/:id', async (c) => {
    try {
      const { id } = c.req.param();
      const password = c.req.query('password') || null;

      const decryptedMessage = await getMessage(id, password);

      return c.json({ message: decryptedMessage });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      return c.json({ error: errorMessage }, 404);
    }
  });
};

export { messageRoutes };