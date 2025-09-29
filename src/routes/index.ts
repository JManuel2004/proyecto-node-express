import { Router } from 'express';
import userRoutes from './users';
import projectRoutes from './project.routes';   

const router = Router();

router.use('/users', userRoutes);
router.use('/projects', projectRoutes);

export default router;