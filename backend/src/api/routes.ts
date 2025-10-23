import { Router } from 'express';
import authRoutes from './routes/authRoutes';
import meetingRoutes from './routes/meetingRoutes';
import taskRoutes from './routes/taskRoutes';
import webhookRoutes from './routes/webhookRoutes';
import usageRoutes from './routes/usageRoutes';
import userRoutes from './routes/userRoutes';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/meetings', meetingRoutes);
router.use('/tasks', taskRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/usage', usageRoutes);
router.use('/users', userRoutes);

// API info endpoint
router.get('/', (_req, res) => {
  res.json({
    name: 'SyncNotesAI API',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      auth: '/api/auth',
      meetings: '/api/meetings',
      tasks: '/api/tasks',
      webhooks: '/api/webhooks',
      usage: '/api/usage',
      users: '/api/users',
    },
  });
});

export default router;
