export { authenticate, authorize } from './auth';
export { errorHandler, notFound, AppError } from './error';
export { 
  validateRegister, 
  validateLogin, 
  validateUpdateUser, 
  handleValidationErrors 
} from './validation';