import { Hono } from 'hono';
import { createMessage, getMessage } from '../controller/message.js';


// Create a sub-router for message-related endpoints
const messageRoutes = new Hono();

// Route to create a new encrypted message
messageRoutes.post('/', createMessage);

// Route to retrieve and auto-delete a message by ID
messageRoutes.get('/:id', getMessage);

export default messageRoutes;
