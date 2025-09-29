// src/routes/project.routes.ts
import { Router } from 'express';
import { ProjectController } from '../controllers';
import { authenticate, authorize } from '../middleware';

const router = Router();

router.use(authenticate);

router.post('/', ProjectController.create);
router.get('/', ProjectController.getAll);
router.get('/my-projects', ProjectController.getMyProjects);
router.get('/stats', ProjectController.getStats);
router.get('/:id', ProjectController.getById);
router.put('/:id', ProjectController.update);
router.delete('/:id', ProjectController.delete);

export default router;