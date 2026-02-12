import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import swaggerUi from 'swagger-ui-express';

import connectDB from './config/database.js';
import validateEnv from './config/envValidation.js';
import swaggerSpec from './config/swagger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { requestId } from './middleware/requestId.js';

// Routes
import authRoutes from './routes/auth.js';
import organizationRoutes from './routes/organizations.js';
import projectRoutes from './routes/projects.js';
import issueRoutes from './routes/issues.js';
import commentRoutes from './routes/comments.js';
import userRoutes from './routes/users.js';
import workLogRoutes from './routes/worklogs.js';
import formRoutes from './routes/forms.js';
import attachmentRoutes from './routes/attachments.js';
import reportRoutes from './routes/reports.js';
import shortcutRoutes from './routes/shortcuts.js';
import sprintRoutes from './routes/sprints.js';
import microsoftRoutes from './routes/microsoft.js';
import filterRoutes from './routes/filters.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();
validateEnv();

if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// IMPORTANT for Nginx reverse proxy
app.set("trust proxy", 1);

const httpServer = createServer(app);


// ========================
// Allowed Origins Setup
// ========================
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173'];


// ========================
// Socket.io Setup
// ========================
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
});


// ========================
// Security Middleware
// ========================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));


// ========================
// CORS Middleware
// ========================
app.use(cors({
  origin: function (origin, callback) {

    // Allow requests with no origin (same domain, curl, health checks)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));


// ========================
// Logging
// ========================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}


// ========================
// Global Middleware
// ========================
app.use(requestId);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());


// ========================
// Rate Limiter
// ========================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);


// ========================
// Health Check
// ========================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime()
  });
});


// ========================
// Static Uploads
// ========================
app.use('/api/uploads', express.static(join(__dirname, 'uploads')));


// ========================
// API Docs
// ========================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// ========================
// Routes
// ========================
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/worklogs', workLogRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/shortcuts', shortcutRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/microsoft', microsoftRoutes);
app.use('/api/filters', filterRoutes);
app.use('/api/dashboard', dashboardRoutes);


// ========================
// Socket Events
// ========================
io.on('connection', (socket) => {

  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
  });

  socket.on('leave-project', (projectId) => {
    socket.leave(`project-${projectId}`);
  });

});


app.set('io', io);


// ========================
// Error Handling
// ========================
app.use(notFound);
app.use(errorHandler);


// ========================
// Start Server
// ========================
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
}
