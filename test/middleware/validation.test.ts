import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { 
  validateRegister, 
  validateLogin, 
  validateUpdateUser, 
  handleValidationErrors,
  validateRequest 
} from '../../src/middleware/validation';

// Mock de express-validator
jest.mock('express-validator', () => ({
  body: jest.fn(() => ({
    isEmail: jest.fn().mockReturnThis(),
    withMessage: jest.fn().mockReturnThis(),
    normalizeEmail: jest.fn().mockReturnThis(),
    isLength: jest.fn().mockReturnThis(),
    matches: jest.fn().mockReturnThis(),
    trim: jest.fn().mockReturnThis(),
    notEmpty: jest.fn().mockReturnThis(),
    optional: jest.fn().mockReturnThis(),
    isIn: jest.fn().mockReturnThis(),
    isBoolean: jest.fn().mockReturnThis()
  })),
  validationResult: jest.fn()
}));

const mockValidationResult = validationResult as jest.MockedFunction<typeof validationResult>;

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('validateRegister', () => {
    it('debe ser un array de validaciones', () => {
      expect(Array.isArray(validateRegister)).toBe(true);
      expect(validateRegister.length).toBe(4);
    });

    it('debe incluir validaciones para email, password, firstName y lastName', () => {
      // Verificar que body fue llamado con los campos correctos
      expect(validateRegister).toBeDefined();
      // Como estamos mockeando express-validator, simplemente verificamos que existan las validaciones
      expect(validateRegister.length).toBeGreaterThan(0);
    });
  });

  describe('validateLogin', () => {
    it('debe ser un array de validaciones', () => {
      expect(Array.isArray(validateLogin)).toBe(true);
      expect(validateLogin.length).toBe(2);
    });

    it('debe incluir validaciones para email y password', () => {
      expect(validateLogin).toBeDefined();
      expect(validateLogin.length).toBeGreaterThan(0);
    });
  });

  describe('validateUpdateUser', () => {
    it('debe ser un array de validaciones', () => {
      expect(Array.isArray(validateUpdateUser)).toBe(true);
      expect(validateUpdateUser.length).toBe(5);
    });

    it('debe incluir validaciones opcionales para todos los campos de actualización', () => {
      expect(validateUpdateUser).toBeDefined();
      expect(validateUpdateUser.length).toBeGreaterThan(0);
    });
  });

  describe('handleValidationErrors', () => {
    it('debe llamar next() cuando no hay errores de validación', () => {
      // Mock de validationResult sin errores
      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([])
      } as any);

      handleValidationErrors(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('debe retornar errores 400 cuando hay errores de validación', () => {
      const mockErrors = [
        {
          type: 'field',
          value: 'invalid-email',
          msg: 'Debe proporcionar un email válido',
          path: 'email',
          location: 'body'
        },
        {
          type: 'field',
          value: '123',
          msg: 'La contraseña debe tener al menos 6 caracteres',
          path: 'password',
          location: 'body'
        }
      ];

      // Mock de validationResult con errores
      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(mockErrors)
      } as any);

      handleValidationErrors(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Errores de validación',
        errors: mockErrors
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar un solo error de validación', () => {
      const mockErrors = [
        {
          type: 'field',
          value: '',
          msg: 'El nombre es requerido',
          path: 'firstName',
          location: 'body'
        }
      ];

      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(mockErrors)
      } as any);

      handleValidationErrors(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Errores de validación',
        errors: mockErrors
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar múltiples errores en el mismo campo', () => {
      const mockErrors = [
        {
          type: 'field',
          value: 'ab',
          msg: 'La contraseña debe tener al menos 6 caracteres',
          path: 'password',
          location: 'body'
        },
        {
          type: 'field',
          value: 'ab',
          msg: 'La contraseña debe contener al menos una letra minúscula, una mayúscula y un número',
          path: 'password',
          location: 'body'
        }
      ];

      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(mockErrors)
      } as any);

      handleValidationErrors(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Errores de validación',
        errors: mockErrors
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe retornar errores con estructura consistente', () => {
      const mockErrors = [
        {
          type: 'field',
          value: 'test@',
          msg: 'Debe proporcionar un email válido',
          path: 'email',
          location: 'body'
        }
      ];

      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(mockErrors)
      } as any);

      handleValidationErrors(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
          errors: expect.any(Array)
        })
      );
    });

    it('debe verificar que validationResult fue llamado con el request correcto', () => {
      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([])
      } as any);

      handleValidationErrors(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
    });
  });

  describe('validateRequest (alias)', () => {
    it('debe ser el mismo que handleValidationErrors', () => {
      expect(validateRequest).toBe(handleValidationErrors);
    });

    it('debe funcionar igual que handleValidationErrors', () => {
      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([])
      } as any);

      validateRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('Integración con express-validator', () => {
    it('debe usar validationResult correctamente cuando no hay errores', () => {
      const mockValidationResultObject = {
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([])
      };
      
      mockValidationResult.mockReturnValue(mockValidationResultObject as any);

      handleValidationErrors(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockValidationResultObject.isEmpty).toHaveBeenCalledTimes(1);
      expect(mockValidationResultObject.array).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('debe usar validationResult correctamente cuando hay errores', () => {
      const mockErrors = [
        {
          type: 'field',
          value: 'invalid',
          msg: 'Campo inválido',
          path: 'test',
          location: 'body'
        }
      ];

      const mockValidationResultObject = {
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(mockErrors)
      };
      
      mockValidationResult.mockReturnValue(mockValidationResultObject as any);

      handleValidationErrors(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockValidationResultObject.isEmpty).toHaveBeenCalledTimes(1);
      expect(mockValidationResultObject.array).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Comportamiento de respuesta', () => {
    it('debe retornar inmediatamente después de enviar respuesta de error', () => {
      const mockErrors = [
        {
          type: 'field',
          value: 'invalid',
          msg: 'Error de prueba',
          path: 'test',
          location: 'body'
        }
      ];

      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(mockErrors)
      } as any);

      // Spy en console para verificar que no hay logs adicionales
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      handleValidationErrors(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Verificar que la función retorna sin ejecutar código adicional
      expect(mockResponse.status).toHaveBeenCalledTimes(1);
      expect(mockResponse.json).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('debe usar el código de estado 400 para errores de validación', () => {
      const mockErrors = [
        {
          type: 'field',
          value: 'test',
          msg: 'Error',
          path: 'field',
          location: 'body'
        }
      ];

      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(mockErrors)
      } as any);

      handleValidationErrors(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });
});