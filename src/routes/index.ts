import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './users';
import projectRoutes from './project.routes';   
import taskRoutes from './task.routes';

const router = Router();

// Health check endpoint para verificar que el servidor funciona
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);

export default router;