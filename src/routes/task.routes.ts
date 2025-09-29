import { Router } from 'express';
import { TaskController } from '../controllers';
import { authenticate, authorize } from '../middleware';

const router = Router();

router.use(authenticate);

router.post('/', TaskController.create);
router.get('/', TaskController.getAll);
router.get('/project/:projectId', TaskController.getByProject);
router.get('/:id', TaskController.getById);
router.put('/:id', TaskController.update);
router.delete('/:id', TaskController.delete);

export default router;