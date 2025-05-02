import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import RateLimit from 'hono-rate-limit';
import { logger } from 'hono/logger';
import { env } from 'hono/adapter';
import messageRoutes from './routes/message.js';
const app = new Hono();
app.use(logger());
const { PORT = '3000', ALLOWED_ORIGINS = '' } = process.env;
// CORS setup
const allowedOrigins = ALLOWED_ORIGINS.split(',').map(o => o.trim());
app.use(cors({
    origin: (origin) => {
        return allowedOrigins.includes(origin ?? '') ? origin : '';
    },
}));
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
serve({
    fetch: app.fetch,
    port: Number(PORT),
}, (info) => {
    console.log(`🚀 Server running at http://localhost:${info.port}`);
});
