import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
  ValidationError,
  errorHandler,
  notFound
} from '../../src/middleware/error';

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    mockRequest = {
      originalUrl: '/test/route'
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    
    // Spy en console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Guardar el NODE_ENV original
    originalNodeEnv = process.env.NODE_ENV;
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restaurar NODE_ENV original
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
    
    // Restaurar console.error
    jest.restoreAllMocks();
  });

  describe('AppError', () => {
    it('debe crear una instancia con propiedades por defecto', () => {
      const error = new AppError('Test error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.stack).toBeDefined();
    });

    it('debe crear una instancia con parámetros personalizados', () => {
      const error = new AppError('Custom error', 400, false);
      
      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(false);
    });

    it('debe capturar stack trace correctamente', () => {
      const error = new AppError('Stack test');
      
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
      expect(error.stack!.length).toBeGreaterThan(0);
      expect(error.stack).toMatch(/Stack test|error\.test\.ts/);
    });
  });

  describe('NotFoundError', () => {
    it('debe crear error 404 con mensaje por defecto', () => {
      const error = new NotFoundError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Recurso no encontrado');
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(true);
    });

    it('debe crear error 404 con mensaje personalizado', () => {
      const error = new NotFoundError('Usuario no encontrado');
      
      expect(error.message).toBe('Usuario no encontrado');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('UnauthorizedError', () => {
    it('debe crear error 401 con mensaje por defecto', () => {
      const error = new UnauthorizedError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('No autorizado');
      expect(error.statusCode).toBe(401);
      expect(error.isOperational).toBe(true);
    });

    it('debe crear error 401 con mensaje personalizado', () => {
      const error = new UnauthorizedError('Token inválido');
      
      expect(error.message).toBe('Token inválido');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('ForbiddenError', () => {
    it('debe crear error 403 con mensaje por defecto', () => {
      const error = new ForbiddenError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Prohibido');
      expect(error.statusCode).toBe(403);
      expect(error.isOperational).toBe(true);
    });

    it('debe crear error 403 con mensaje personalizado', () => {
      const error = new ForbiddenError('Sin permisos');
      
      expect(error.message).toBe('Sin permisos');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('ConflictError', () => {
    it('debe crear error 409 con mensaje por defecto', () => {
      const error = new ConflictError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('El recurso ya existe');
      expect(error.statusCode).toBe(409);
      expect(error.isOperational).toBe(true);
    });

    it('debe crear error 409 con mensaje personalizado', () => {
      const error = new ConflictError('Email ya registrado');
      
      expect(error.message).toBe('Email ya registrado');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('BadRequestError', () => {
    it('debe crear error 400 con mensaje por defecto', () => {
      const error = new BadRequestError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Solicitud incorrecta');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('debe crear error 400 con mensaje personalizado', () => {
      const error = new BadRequestError('Datos faltantes');
      
      expect(error.message).toBe('Datos faltantes');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('ValidationError', () => {
    it('debe crear error 400 con mensaje por defecto', () => {
      const error = new ValidationError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Error de validación');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('debe crear error 400 con mensaje personalizado', () => {
      const error = new ValidationError('Campo requerido');
      
      expect(error.message).toBe('Campo requerido');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('errorHandler', () => {
    describe('en entorno de desarrollo', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development';
      });

      it('debe logear el error', () => {
        const error = new Error('Test error');
        const consoleSpy = jest.spyOn(console, 'error');

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(consoleSpy).toHaveBeenCalledWith('Error:', error);
      });

      it('debe incluir stack trace para AppError', () => {
        const error = new AppError('Test error', 400);

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Test error',
          stack: error.stack
        });
      });
    });

    describe('en entorno de producción', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
      });

      it('no debe logear el error', () => {
        const error = new Error('Test error');
        const consoleSpy = jest.spyOn(console, 'error');

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(consoleSpy).not.toHaveBeenCalled();
      });

      it('no debe incluir stack trace para AppError', () => {
        const error = new AppError('Test error', 400);

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Test error'
        });
      });

      it('debe retornar mensaje genérico para errores no operacionales', () => {
        const error = new Error('Internal database error');

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Error interno del servidor'
        });
      });
    });

    describe('manejo de AppError', () => {
      it('debe manejar NotFoundError correctamente', () => {
        const error = new NotFoundError('Usuario no encontrado');

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Usuario no encontrado'
        });
      });

      it('debe manejar UnauthorizedError correctamente', () => {
        const error = new UnauthorizedError('Token expirado');

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Token expirado'
        });
      });

      it('debe manejar ForbiddenError correctamente', () => {
        const error = new ForbiddenError('Sin permisos de administrador');

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Sin permisos de administrador'
        });
      });

      it('debe manejar ConflictError correctamente', () => {
        const error = new ConflictError('Email ya existe');

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(409);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Email ya existe'
        });
      });

      it('debe manejar BadRequestError correctamente', () => {
        const error = new BadRequestError('Datos inválidos');

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Datos inválidos'
        });
      });
    });

    describe('manejo de errores de MongoDB', () => {
      it('debe manejar MongoError con código 11000 (duplicado)', () => {
        const error = new Error('Duplicate key') as any;
        error.name = 'MongoError';
        error.code = 11000;

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(409);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Recurso duplicado'
        });
      });

      it('debe manejar ValidationError de Mongoose', () => {
        const error = new Error('Validation failed');
        error.name = 'ValidationError';

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Datos de entrada inválidos'
        });
      });

      it('debe manejar CastError de Mongoose', () => {
        const error = new Error('Cast failed');
        error.name = 'CastError';

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'ID inválido'
        });
      });
    });

    describe('manejo de errores genéricos', () => {
      it('debe manejar errores desconocidos en desarrollo', () => {
        process.env.NODE_ENV = 'development';
        const error = new Error('Unknown error');

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Unknown error'
        });
      });

      it('debe manejar errores desconocidos en producción', () => {
        process.env.NODE_ENV = 'production';
        const error = new Error('Unknown error');

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Error interno del servidor'
        });
      });

      it('debe manejar errores sin environment definido', () => {
        delete process.env.NODE_ENV;
        const error = new Error('Test error');

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Test error'
        });
      });
    });
  });

  describe('notFound', () => {
    it('debe crear NotFoundError y llamar next', () => {
      notFound(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const calledError = (mockNext as jest.Mock).mock.calls[0][0];
      
      expect(calledError).toBeInstanceOf(NotFoundError);
      expect(calledError.message).toBe('Ruta /test/route no encontrada');
      expect(calledError.statusCode).toBe(404);
    });

    it('debe usar originalUrl del request', () => {
      mockRequest.originalUrl = '/api/users/123';

      notFound(mockRequest as Request, mockResponse as Response, mockNext);

      const calledError = (mockNext as jest.Mock).mock.calls[0][0];
      expect(calledError.message).toBe('Ruta /api/users/123 no encontrada');
    });

    it('debe manejar originalUrl vacío', () => {
      mockRequest.originalUrl = '';

      notFound(mockRequest as Request, mockResponse as Response, mockNext);

      const calledError = (mockNext as jest.Mock).mock.calls[0][0];
      expect(calledError.message).toBe('Ruta  no encontrada');
    });

    it('debe manejar originalUrl undefined', () => {
      mockRequest.originalUrl = undefined;

      notFound(mockRequest as Request, mockResponse as Response, mockNext);

      const calledError = (mockNext as jest.Mock).mock.calls[0][0];
      expect(calledError.message).toBe('Ruta undefined no encontrada');
    });
  });

  describe('integración de clases de error', () => {
    it('todas las clases de error deben heredar de AppError', () => {
      const errors = [
        new NotFoundError(),
        new UnauthorizedError(),
        new ForbiddenError(),
        new ConflictError(),
        new BadRequestError(),
        new ValidationError()
      ];

      errors.forEach(error => {
        expect(error).toBeInstanceOf(AppError);
        expect(error).toBeInstanceOf(Error);
        expect(error.isOperational).toBe(true);
      });
    });

    it('debe funcionar el flujo completo desde notFound hasta errorHandler', () => {
      process.env.NODE_ENV = 'test';
      
      // Simular notFound
      notFound(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Obtener el error generado
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      
      // Simular errorHandler
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Ruta /test/route no encontrada'
      });
    });
  });
});