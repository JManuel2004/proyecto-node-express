import { Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../src/middleware/auth';
import { authService } from '../../src/services/jwt.service';
import { AuthRequest, JwtCustomPayload } from '../../src/types';

// Mock del authService
jest.mock('../../src/services/jwt.service');
const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      user: undefined
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('debe autenticar usuario con token válido', async () => {
      const mockDecoded: JwtCustomPayload = {
        userId: 'user123',
        email: 'test@example.com',
        roles: 'usuario'
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-jwt-token'
      };
      mockAuthService.verifyToken.mockResolvedValue(mockDecoded);

      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('valid-jwt-token');
      expect(mockRequest.user).toEqual({
        userId: 'user123',
        email: 'test@example.com',
        role: 'usuario'
      });
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('debe extraer token correctamente del header Bearer', async () => {
      const mockDecoded: JwtCustomPayload = {
        userId: 'user123',
        email: 'test@example.com',
        roles: 'superadmin'
      };

      mockRequest.headers = {
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
      };
      mockAuthService.verifyToken.mockResolvedValue(mockDecoded);

      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test');
      expect(mockRequest.user).toEqual({
        userId: 'user123',
        email: 'test@example.com',
        role: 'superadmin'
      });
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('debe rechazar request sin header de autorización', async () => {
      mockRequest.headers = {};

      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token de acceso requerido'
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('debe rechazar header de autorización vacío', async () => {
      mockRequest.headers = {
        authorization: ''
      };

      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token de acceso requerido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe rechazar header sin formato Bearer', async () => {
      mockRequest.headers = {
        authorization: 'Invalid token-format'
      };

      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token de acceso requerido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe rechazar header que solo contiene "Bearer"', async () => {
      mockRequest.headers = {
        authorization: 'Bearer'
      };

      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token de acceso requerido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar token inválido', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };
      mockAuthService.verifyToken.mockRejectedValue(new Error('Token inválido'));

      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('invalid-token');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token inválido o expirado'
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('debe manejar token expirado', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token'
      };
      mockAuthService.verifyToken.mockRejectedValue(new Error('Token expirado'));

      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('expired-token');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token inválido o expirado'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar errores del servicio de autenticación', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };
      mockAuthService.verifyToken.mockRejectedValue(new Error('Error del servicio'));

      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token inválido o expirado'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar header de autorización con espacios extra', async () => {
      const mockDecoded: JwtCustomPayload = {
        userId: 'user123',
        email: 'test@example.com',
        roles: 'usuario'
      };

      mockRequest.headers = {
        authorization: 'Bearer   token-with-spaces'
      };
      mockAuthService.verifyToken.mockResolvedValue(mockDecoded);

      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('  token-with-spaces');
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('debe asignar correctamente las propiedades del usuario', async () => {
      const mockDecoded: JwtCustomPayload = {
        userId: 'admin456',
        email: 'admin@example.com',
        roles: 'superadmin'
      };

      mockRequest.headers = {
        authorization: 'Bearer admin-token'
      };
      mockAuthService.verifyToken.mockResolvedValue(mockDecoded);

      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toEqual({
        userId: 'admin456',
        email: 'admin@example.com',
        role: 'superadmin'
      });
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('authorize', () => {
    it('debe permitir acceso a usuario con rol autorizado', () => {
      mockRequest.user = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'usuario'
      };

      const authorizeMiddleware = authorize('usuario', 'superadmin');
      authorizeMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('debe permitir acceso a superadmin cuando se requiere superadmin', () => {
      mockRequest.user = {
        userId: 'admin123',
        email: 'admin@example.com',
        role: 'superadmin'
      };

      const authorizeMiddleware = authorize('superadmin');
      authorizeMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('debe rechazar usuario sin autenticar', () => {
      mockRequest.user = undefined;

      const authorizeMiddleware = authorize('usuario');
      authorizeMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario no autenticado'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe rechazar usuario con rol no autorizado', () => {
      mockRequest.user = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'usuario'
      };

      const authorizeMiddleware = authorize('superadmin');
      authorizeMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar múltiples roles permitidos', () => {
      mockRequest.user = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'usuario'
      };

      const authorizeMiddleware = authorize('usuario', 'superadmin', 'moderador');
      authorizeMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('debe rechazar cuando ningún rol coincide', () => {
      mockRequest.user = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'guest' as unknown as 'usuario'
      };

      const authorizeMiddleware = authorize('usuario', 'superadmin');
      authorizeMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar array vacío de roles', () => {
      mockRequest.user = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'usuario'
      };

      const authorizeMiddleware = authorize();
      authorizeMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe ser case-sensitive con los roles', () => {
      mockRequest.user = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'Usuario' as unknown as 'usuario' // Diferente capitalización
      };

      const authorizeMiddleware = authorize('usuario');
      authorizeMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe funcionar como función de orden superior', () => {
      const authorizeMiddleware = authorize('usuario');
      
      expect(typeof authorizeMiddleware).toBe('function');
      expect(authorizeMiddleware.length).toBe(3); // req, res, next
    });
  });

  describe('integración authenticate + authorize', () => {
    it('debe funcionar el flujo completo con token válido y rol autorizado', async () => {
      const mockDecoded: JwtCustomPayload = {
        userId: 'user123',
        email: 'test@example.com',
        roles: 'superadmin'
      };

      // Simular authenticate
      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };
      mockAuthService.verifyToken.mockResolvedValue(mockDecoded);

      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRequest.user).toBeDefined();

      // Reset mocks para authorize
      jest.clearAllMocks();

      // Simular authorize
      const authorizeMiddleware = authorize('superadmin');
      authorizeMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('debe fallar el flujo con token válido pero rol no autorizado', async () => {
      const mockDecoded: JwtCustomPayload = {
        userId: 'user123',
        email: 'test@example.com',
        roles: 'usuario'
      };

      // Simular authenticate exitoso
      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };
      mockAuthService.verifyToken.mockResolvedValue(mockDecoded);

      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRequest.user).toBeDefined();

      // Reset mocks para authorize
      jest.clearAllMocks();

      // Simular authorize que falla
      const authorizeMiddleware = authorize('superadmin');
      authorizeMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});