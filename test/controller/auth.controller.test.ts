import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../../src/controllers/auth.controller';
import { authService } from '../../src/services/jwt.service';
import { UserLoginInput, RegisterRequest } from '../../src/types';

// Mock del authService
jest.mock('../../src/services/jwt.service');
const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('AuthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('debe hacer login exitosamente', async () => {
      const loginData: UserLoginInput = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockResult = {
        id: 'user123',
        username: 'John Doe',
        email: 'test@example.com',
        roles: 'usuario' as const,
        token: 'jwt-token-123'
      };

      mockRequest.body = loginData;
      mockAuthService.login.mockResolvedValue(mockResult);

      await AuthController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login exitoso',
        data: mockResult
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar errores de login', async () => {
      const loginData: UserLoginInput = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const mockError = new Error('Credenciales inválidas');
      mockRequest.body = loginData;
      mockAuthService.login.mockRejectedValue(mockError);

      await AuthController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('debe manejar datos de login faltantes', async () => {
      const loginData: UserLoginInput = {
        email: '',
        password: ''
      };

      const mockError = new Error('Datos faltantes');
      mockRequest.body = loginData;
      mockAuthService.login.mockRejectedValue(mockError);

      await AuthController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('debe manejar usuario inactivo', async () => {
      const loginData: UserLoginInput = {
        email: 'inactive@example.com',
        password: 'password123'
      };

      const mockError = new Error('Cuenta desactivada');
      mockRequest.body = loginData;
      mockAuthService.login.mockRejectedValue(mockError);

      await AuthController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('debe registrar un usuario exitosamente', async () => {
      const registerData: RegisterRequest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'newuser@example.com',
        password: 'password123'
      };

      const mockResult = {
        id: 'user456',
        username: 'John Doe',
        email: 'newuser@example.com',
        roles: 'usuario' as const
      };

      mockRequest.body = registerData;
      mockAuthService.register.mockResolvedValue(mockResult);

      await AuthController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.register).toHaveBeenCalledWith(registerData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: mockResult
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar email ya existente', async () => {
      const registerData: RegisterRequest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'password123'
      };

      const mockError = new Error('El email ya está registrado');
      mockRequest.body = registerData;
      mockAuthService.register.mockRejectedValue(mockError);

      await AuthController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.register).toHaveBeenCalledWith(registerData);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('debe manejar datos de registro inválidos', async () => {
      const registerData: RegisterRequest = {
        firstName: '',
        lastName: '',
        email: 'invalid-email',
        password: '123'
      };

      const mockError = new Error('Datos de registro inválidos');
      mockRequest.body = registerData;
      mockAuthService.register.mockRejectedValue(mockError);

      await AuthController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.register).toHaveBeenCalledWith(registerData);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('debe manejar contraseña débil', async () => {
      const registerData: RegisterRequest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'weak'
      };

      const mockError = new Error('La contraseña debe tener al menos 6 caracteres');
      mockRequest.body = registerData;
      mockAuthService.register.mockRejectedValue(mockError);

      await AuthController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.register).toHaveBeenCalledWith(registerData);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('verifyToken', () => {
    it('debe verificar token válido exitosamente', async () => {
      const token = 'valid-jwt-token';
      const mockDecoded = {
        userId: 'user123',
        email: 'test@example.com',
        roles: 'usuario' as const
      };

      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };
      mockAuthService.verifyToken.mockResolvedValue(mockDecoded);

      await AuthController.verifyToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Token válido',
        data: mockDecoded
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar header de autorización faltante', async () => {
      mockRequest.headers = {};

      await AuthController.verifyToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token requerido'
      });
      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar header de autorización sin Bearer', async () => {
      mockRequest.headers = {
        authorization: 'invalid-format-token'
      };

      await AuthController.verifyToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token requerido'
      });
      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar header de autorización vacío', async () => {
      mockRequest.headers = {
        authorization: ''
      };

      await AuthController.verifyToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token requerido'
      });
      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar token inválido', async () => {
      const token = 'invalid-jwt-token';
      const mockError = new Error('Token inválido');

      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };
      mockAuthService.verifyToken.mockRejectedValue(mockError);

      await AuthController.verifyToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalledWith({
        success: true,
        message: 'Token válido',
        data: expect.anything()
      });
    });

    it('debe manejar token expirado', async () => {
      const token = 'expired-jwt-token';
      const mockError = new Error('Token expirado');

      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };
      mockAuthService.verifyToken.mockRejectedValue(mockError);

      await AuthController.verifyToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalledWith({
        success: true,
        message: 'Token válido',
        data: expect.anything()
      });
    });

    it('debe extraer token correctamente del header Bearer', async () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      const mockDecoded = {
        userId: 'user123',
        email: 'test@example.com',
        roles: 'usuario' as const
      };

      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };
      mockAuthService.verifyToken.mockResolvedValue(mockDecoded);

      await AuthController.verifyToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Token válido',
        data: mockDecoded
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});