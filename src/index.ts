import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import RateLimit from 'hono-rate-limit';
import { logger } from 'hono/logger';
import messageRoutes from './routes/message.js';

const app = new Hono();


app.use(logger());


const PORT = process.env.PORT || 3000;


app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowed = [
        'http://localhost:3000',
        'https://lockit.up.railway.app',
        'https://lockitt.netlify.app',
      ];
      return allowed.includes(origin ?? '') ? origin : '';
    },
    allowHeaders: ['Content-Type'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
  })
);


// Rate limit for /message routes
app.use('/message', RateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 5,
  message: 'Rate limit exceeded. Max 5 requests per minute.',
}));

// Routes
app.route('/message', messageRoutes);

// Root route
app.get('/', (c) => c.json({ message: 'Lockit API is running.' }));

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled Error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// Server start
serve(
  {
    fetch: app.fetch,
    port: Number(PORT),
  },
  (info) => {
    console.log(`🚀 Server running at http://localhost:${info.port}`);
  }
);

