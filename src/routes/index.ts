import { Router } from 'express';
import userRoutes from './users';
import projectRoutes from './project.routes';   
import taskRoutes from './task.routes';

const router = Router();

router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);

export default router;