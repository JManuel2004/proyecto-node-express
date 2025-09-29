import { Request, Response, NextFunction } from 'express';
import { UserController } from '../../src/controllers/user.controller';
import { UserService } from '../../src/services/user.service';
import { AuthRequest, RegisterRequest, LoginRequest, UpdateUserRequest } from '../../src/types';
import { UnauthorizedError, BadRequestError } from '../../src/middleware/error';

// Mock del UserService
jest.mock('../../src/services/user.service');
const mockUserService = UserService as jest.Mocked<typeof UserService>;

describe('UserController', () => {
  let mockRequest: Partial<Request | AuthRequest>;
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

  describe('register', () => {
    it('debe registrar un usuario exitosamente', async () => {
      const userData: RegisterRequest = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const mockResult = {
        user: {
          _id: '123',
          email: 'test@example.com',
          password: '',
          firstName: 'John',
          lastName: 'Doe',
          role: 'usuario' as const,
          isActive: true
        },
        token: 'jwt-token-123'
      };

      mockRequest.body = userData;
      mockUserService.register.mockResolvedValue(mockResult);

      await UserController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserService.register).toHaveBeenCalledWith(userData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: mockResult
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar errores durante el registro', async () => {
      const userData: RegisterRequest = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const mockError = new Error('Error de registro');
      mockRequest.body = userData;
      mockUserService.register.mockRejectedValue(mockError);

      await UserController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserService.register).toHaveBeenCalledWith(userData);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('debe hacer login exitosamente', async () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockResult = {
        user: {
          _id: '123',
          email: 'test@example.com',
          password: '',
          firstName: 'John',
          lastName: 'Doe',
          role: 'usuario' as const,
          isActive: true
        },
        token: 'jwt-token'
      };

      mockRequest.body = loginData;
      mockUserService.login.mockResolvedValue(mockResult);

      await UserController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserService.login).toHaveBeenCalledWith(loginData);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login exitoso',
        data: mockResult
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar errores durante el login', async () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const mockError = new UnauthorizedError('Credenciales inválidas');
      mockRequest.body = loginData;
      mockUserService.login.mockRejectedValue(mockError);

      await UserController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserService.login).toHaveBeenCalledWith(loginData);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('debe obtener el perfil del usuario exitosamente', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@example.com',
        password: '',
        firstName: 'John',
        lastName: 'Doe',
        role: 'usuario' as const,
        isActive: true
      };

      mockRequest = {
        user: {
          userId: '123',
          email: 'test@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockUserService.getProfile.mockResolvedValue(mockUser);

      await UserController.getProfile(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserService.getProfile).toHaveBeenCalledWith('123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { user: mockUser }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar usuario no autenticado', async () => {
      mockRequest = { user: undefined } as unknown as AuthRequest;

      await UserController.getProfile(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(UnauthorizedError)
      );
      expect(mockUserService.getProfile).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('debe manejar errores al obtener el perfil', async () => {
      const mockError = new Error('Error al obtener usuario');
      
      mockRequest = {
        user: {
          userId: '123',
          email: 'test@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockUserService.getProfile.mockRejectedValue(mockError);

      await UserController.getProfile(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserService.getProfile).toHaveBeenCalledWith('123');
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('getAllUsers', () => {
    it('debe obtener todos los usuarios con paginación por defecto', async () => {
      const mockResult = {
        users: [
          {
            _id: '1',
            email: 'user1@example.com',
            password: '',
            firstName: 'User',
            lastName: 'One',
            role: 'usuario' as const,
            isActive: true
          }
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalUsers: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      };

      mockRequest = {
        query: {},
        user: { userId: '123', email: 'admin@example.com', role: 'superadmin' }
      } as unknown as AuthRequest;

      mockUserService.getAllUsers.mockResolvedValue(mockResult as any);

      await UserController.getAllUsers(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserService.getAllUsers).toHaveBeenCalledWith(1, 10);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe obtener usuarios con paginación personalizada', async () => {
      const mockResult = {
        users: [],
        pagination: {
          currentPage: 2,
          totalPages: 0,
          totalUsers: 0,
          hasNextPage: false,
          hasPrevPage: true
        }
      };

      mockRequest = {
        query: { page: '2', limit: '5' },
        user: { userId: '123', email: 'admin@example.com', role: 'superadmin' }
      } as unknown as AuthRequest;

      mockUserService.getAllUsers.mockResolvedValue(mockResult as any);

      await UserController.getAllUsers(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserService.getAllUsers).toHaveBeenCalledWith(2, 5);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar errores al obtener usuarios', async () => {
      const mockError = new Error('Error al obtener usuarios');
      
      mockRequest = {
        query: {},
        user: { userId: '123', email: 'admin@example.com', role: 'superadmin' }
      } as unknown as AuthRequest;

      mockUserService.getAllUsers.mockRejectedValue(mockError);

      await UserController.getAllUsers(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('createUser', () => {
    it('debe crear un usuario exitosamente', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: 'usuario' as const
      };

      const mockResult = {
        user: {
          _id: '456',
          email: 'newuser@example.com',
          password: '',
          firstName: 'New',
          lastName: 'User',
          role: 'usuario' as const,
          isActive: true
        }
      };

      mockRequest = {
        body: userData,
        user: { userId: '123', email: 'admin@example.com', role: 'superadmin' }
      } as unknown as AuthRequest;

      mockUserService.createUser.mockResolvedValue(mockResult);

      await UserController.createUser(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserService.createUser).toHaveBeenCalledWith(userData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Usuario creado exitosamente',
        data: mockResult
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar errores al crear usuario', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      const mockError = new BadRequestError('Email ya existe');
      
      mockRequest = {
        body: userData,
        user: { userId: '123', email: 'admin@example.com', role: 'superadmin' }
      } as unknown as AuthRequest;

      mockUserService.createUser.mockRejectedValue(mockError);

      await UserController.createUser(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('debe actualizar un usuario exitosamente', async () => {
      const updates: UpdateUserRequest = {
        firstName: 'Updated',
        lastName: 'Name',
        isActive: false
      };

      const mockResult = {
        user: {
          _id: '123',
          email: 'user@example.com',
          password: '',
          firstName: 'Updated',
          lastName: 'Name',
          role: 'usuario' as const,
          isActive: false
        }
      };

      mockRequest = {
        params: { id: '123' },
        body: updates,
        user: { userId: '456', email: 'admin@example.com', role: 'superadmin' }
      } as unknown as AuthRequest;

      mockUserService.updateUser.mockResolvedValue(mockResult);

      await UserController.updateUser(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserService.updateUser).toHaveBeenCalledWith('123', updates);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: mockResult
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar parámetro id faltante', async () => {
      const updates: UpdateUserRequest = {
        firstName: 'Updated'
      };

      mockRequest = {
        params: {},
        body: updates,
        user: { userId: '456', email: 'admin@example.com', role: 'superadmin' }
      } as unknown as AuthRequest;

      await UserController.updateUser(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(BadRequestError)
      );
      expect(mockUserService.updateUser).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('debe manejar errores al actualizar usuario', async () => {
      const updates: UpdateUserRequest = {
        email: 'invalid-email'
      };

      const mockError = new BadRequestError('Email inválido');
      
      mockRequest = {
        params: { id: '123' },
        body: updates,
        user: { userId: '456', email: 'admin@example.com', role: 'superadmin' }
      } as unknown as AuthRequest;

      mockUserService.updateUser.mockRejectedValue(mockError);

      await UserController.updateUser(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('debe eliminar un usuario exitosamente', async () => {
      mockRequest = {
        params: { id: '123' },
        user: { userId: '456', email: 'admin@example.com', role: 'superadmin' }
      } as unknown as AuthRequest;

      mockUserService.deleteUser.mockResolvedValue(undefined);

      await UserController.deleteUser(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserService.deleteUser).toHaveBeenCalledWith('123', '456');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar parámetros faltantes', async () => {
      mockRequest = {
        params: {},
        user: { userId: '456', email: 'admin@example.com', role: 'superadmin' }
      } as unknown as AuthRequest;

      await UserController.deleteUser(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(BadRequestError)
      );
      expect(mockUserService.deleteUser).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('debe manejar usuario no autenticado', async () => {
      mockRequest = {
        params: { id: '123' },
        user: undefined
      } as unknown as AuthRequest;

      await UserController.deleteUser(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(BadRequestError)
      );
      expect(mockUserService.deleteUser).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('debe manejar errores al eliminar usuario', async () => {
      const mockError = new BadRequestError('No se puede eliminar este usuario');
      
      mockRequest = {
        params: { id: '123' },
        user: { userId: '456', email: 'admin@example.com', role: 'superadmin' }
      } as unknown as AuthRequest;

      mockUserService.deleteUser.mockRejectedValue(mockError);

      await UserController.deleteUser(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('debe obtener un usuario por ID exitosamente', async () => {
      const mockUser = {
        _id: '123',
        email: 'user@example.com',
        password: '',
        firstName: 'John',
        lastName: 'Doe',
        role: 'usuario' as const,
        isActive: true
      };

      mockRequest = {
        params: { id: '123' },
        user: { userId: '456', email: 'admin@example.com', role: 'superadmin' }
      } as unknown as AuthRequest;

      mockUserService.getUserById.mockResolvedValue(mockUser);

      await UserController.getUserById(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserService.getUserById).toHaveBeenCalledWith('123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { user: mockUser }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar parámetro id faltante', async () => {
      mockRequest = {
        params: {},
        user: { userId: '456', email: 'admin@example.com', role: 'superadmin' }
      } as unknown as AuthRequest;

      await UserController.getUserById(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(BadRequestError)
      );
      expect(mockUserService.getUserById).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('debe manejar errores al obtener usuario por ID', async () => {
      const mockError = new Error('Usuario no encontrado');
      
      mockRequest = {
        params: { id: '999' },
        user: { userId: '456', email: 'admin@example.com', role: 'superadmin' }
      } as unknown as AuthRequest;

      mockUserService.getUserById.mockRejectedValue(mockError);

      await UserController.getUserById(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });
});