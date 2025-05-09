import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import RateLimit from 'hono-rate-limit';
import { logger } from 'hono/logger';
import { messageRoutes } from './routes/message.js';

const app = new Hono();
const PORT = process.env.PORT || 3000;


app.use(
  cors({
    origin: (origin) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'https://lockit.up.railway.app',
        'https://lockitt.netlify.app',
      ];
      // Allow only the allowed origins
      return allowedOrigins.includes(origin ?? '') ? origin : '';
    },
    credentials: true, // Allow credentials (cookies, etc.)
    allowMethods: ['GET', 'POST', 'OPTIONS'], // Allow specific methods
    allowHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
  })
);



app.use(logger());

app.use(
  '/message',
  RateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 5,
    message: 'Rate limit exceeded. Max 5 requests per minute.',
  })
);



messageRoutes(app);


app.get('/', (c) => c.json({ message: 'Lockit API is running.' }));


app.onError((err, c) => {
  console.error('Unhandled Error:', err.stack || err);
  return c.json({ error: 'Internal Server Error' }, 500);
});


serve(
  {
    fetch: app.fetch,
    port: Number(PORT),
  },
  (info) => {
    console.log(`🚀 Server running at http://localhost:${info.port}`);
  }
);
