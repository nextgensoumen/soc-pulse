import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createApiRouter } from './routes/api.js';

const app = express();
const server = http.createServer(app);

// Allow WebSockets and API requests from the Vite Dashboard on port 5173 
// but bind correctly to all interfaces for AWS
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Attach the IO instance to our API routes
app.use('/api/modules', createApiRouter(io));

// Global Socket Connection Handler
io.on('connection', (socket) => {
    console.log(`[Dashboard Client Connected]: ${socket.id}`);

    // Allow the dashboard to 'subscribe' to specific module log streams
    socket.on('subscribe_module', (moduleId) => {
        socket.join(`module_${moduleId}`);
        console.log(`Client ${socket.id} subscribed to module_${moduleId}`);
    });

    socket.on('disconnect', () => {
        console.log(`[Dashboard Client Disconnected]: ${socket.id}`);
    });
});

// Start Server on Port 5000 exactly
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`==================================================`);
    console.log(`🛡️  SOC Pulse Backend is live on 0.0.0.0:${PORT} 🛡️`);
    console.log(`==================================================`);
});
