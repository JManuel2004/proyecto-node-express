import { Router } from 'express';
import { UserController } from '../controllers';
import { 
  authenticate, 
  authorize, 
  validateRegister, 
  validateLogin, 
  validateUpdateUser,
  handleValidationErrors 
} from '../middleware';

const router = Router();

// Rutas públicas
router.post('/register', 
  validateRegister, 
  handleValidationErrors, 
  UserController.register
);

router.post('/login', 
  validateLogin, 
  handleValidationErrors, 
  UserController.login
);

// Rutas protegidas - requieren autenticación
router.use(authenticate);

// Perfil del usuario autenticado (cualquier usuario autenticado)
router.get('/profile', UserController.getProfile);

// Rutas solo para superadmin
router.get('/', 
  authorize('superadmin'), 
  UserController.getAllUsers
);

router.post('/', 
  authorize('superadmin'),
  validateRegister, 
  handleValidationErrors, 
  UserController.createUser
);

router.get('/:id', 
  authorize('superadmin'), 
  UserController.getUserById
);

router.put('/:id', 
  authorize('superadmin'),
  validateUpdateUser, 
  handleValidationErrors, 
  UserController.updateUser
);

router.delete('/:id', 
  authorize('superadmin'), 
  UserController.deleteUser
);

export default router;