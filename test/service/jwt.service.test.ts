import { authService, JWTService } from '../../src/services/jwt.service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config';
import { 
  UnauthorizedError, 
  ConflictError 
} from '../../src/middleware/error';
import { 
  UserLoginInput, 
  RegisterRequest, 
  UserRole,
  JwtCustomPayload 
} from '../../src/types';

// Mock de las dependencias
jest.mock('../../src/models', () => ({
  User: jest.fn(),
  Task: {},
  Project: {}
}));

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../src/config', () => ({
  config: {
    jwtSecret: 'test-secret-key'
  }
}));

// Importar después del mock
const { User } = require('../../src/models');
const mockedUser = User as jest.MockedFunction<any>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// Configurar métodos estáticos del modelo User
mockedUser.findById = jest.fn();
mockedUser.findOne = jest.fn();
mockedUser.find = jest.fn();

describe('AuthService', () => {
  const mockUserId = '507f1f77bcf86cd799439011';
  const mockEmail = 'test@example.com';
  const mockPassword = 'password123';
  const mockHashedPassword = '$2a$12$hashedpassword';
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

  const mockUser = {
    _id: mockUserId,
    email: mockEmail,
    password: mockHashedPassword,
    username: 'testuser',
    firstName: 'Juan',
    lastName: 'Pérez',
    role: 'usuario' as const,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockUserWithPassword = {
    ...mockUser,
    password: mockHashedPassword
  };

  const mockLoginData: UserLoginInput = {
    email: mockEmail,
    password: mockPassword
  };

  const mockRegisterData: RegisterRequest = {
    firstName: 'Juan',
    lastName: 'Pérez',
    email: mockEmail,
    password: mockPassword
  };

  const mockJwtPayload: JwtCustomPayload = {
    userId: mockUserId,
    email: mockEmail,
    roles: 'usuario'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('debería realizar login exitosamente con credenciales válidas', async () => {
      // Arrange
      const mockFindOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockUserWithPassword)
        })
      });
      mockedUser.findOne = mockFindOne;
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedJwt.sign.mockReturnValue(mockToken as never);

      // Act
      const result = await authService.login(mockLoginData);

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith({ email: mockEmail, isActive: true });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(mockPassword, mockHashedPassword);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        {
          userId: mockUserId,
          email: mockEmail,
          roles: 'usuario'
        },
        config.jwtSecret,
        { expiresIn: '7d' }
      );
      
      expect(result).toEqual({
        id: mockUserId,
        username: 'testuser',
        email: mockEmail,
        roles: 'usuario',
        token: mockToken
      });
    });

    it('debería usar firstName y lastName como username si no hay username', async () => {
      // Arrange
      const userWithoutUsername = { ...mockUserWithPassword, username: undefined };
      const mockFindOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(userWithoutUsername)
        })
      });
      mockedUser.findOne = mockFindOne;
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedJwt.sign.mockReturnValue(mockToken as never);

      // Act
      const result = await authService.login(mockLoginData);

      // Assert
      expect(result.username).toBe('Juan Pérez');
    });

    it('debería lanzar UnauthorizedError si el usuario no existe', async () => {
      // Arrange
      const mockFindOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null)
        })
      });
      mockedUser.findOne = mockFindOne;

      // Act & Assert
      await expect(authService.login(mockLoginData)).rejects.toThrow(UnauthorizedError);
      expect(mockFindOne).toHaveBeenCalledWith({ email: mockEmail, isActive: true });
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('debería lanzar UnauthorizedError si la contraseña es incorrecta', async () => {
      // Arrange
      const mockFindOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockUserWithPassword)
        })
      });
      mockedUser.findOne = mockFindOne;
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(authService.login(mockLoginData)).rejects.toThrow(UnauthorizedError);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(mockPassword, mockHashedPassword);
      expect(mockedJwt.sign).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('debería registrar un nuevo usuario exitosamente', async () => {
      // Arrange
      const mockFindOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });
      mockedUser.findOne = mockFindOne;
      mockedBcrypt.hash.mockResolvedValue(mockHashedPassword as never);
      
      const mockSave = jest.fn().mockResolvedValue({
        toObject: jest.fn().mockReturnValue(mockUser)
      });
      mockedUser.mockReturnValueOnce({
        save: mockSave
      } as any);

      // Act
      const result = await authService.register(mockRegisterData);

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith({ email: mockEmail, isActive: true });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(mockPassword, 12);
      expect(mockedUser).toHaveBeenCalledWith({
        firstName: 'Juan',
        lastName: 'Pérez',
        email: mockEmail,
        password: mockHashedPassword,
        role: UserRole.USER,
        isActive: true
      });

      expect(result).toEqual({
        id: mockUserId,
        username: 'testuser',
        email: mockEmail,
        roles: 'usuario'
      });
    });

    it('debería usar firstName y lastName como username si no hay username en register', async () => {
      // Arrange
      const userWithoutUsername = { ...mockUser, username: undefined };
      const mockFindOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });
      mockedUser.findOne = mockFindOne;
      mockedBcrypt.hash.mockResolvedValue(mockHashedPassword as never);
      
      const mockSave = jest.fn().mockResolvedValue({
        toObject: jest.fn().mockReturnValue(userWithoutUsername)
      });
      mockedUser.mockReturnValueOnce({
        save: mockSave
      } as any);

      // Act
      const result = await authService.register(mockRegisterData);

      // Assert
      expect(result.username).toBe('Juan Pérez');
    });

    it('debería lanzar ConflictError si el email ya está registrado', async () => {
      // Arrange
      const mockFindOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser)
      });
      mockedUser.findOne = mockFindOne;

      // Act & Assert
      await expect(authService.register(mockRegisterData)).rejects.toThrow(ConflictError);
      expect(mockFindOne).toHaveBeenCalledWith({ email: mockEmail, isActive: true });
      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
    });
  });

  describe('verifyToken', () => {
    it('debería verificar un token válido exitosamente', async () => {
      // Arrange
      mockedJwt.verify.mockReturnValue(mockJwtPayload as never);
      const mockFindById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser)
      });
      mockedUser.findById = mockFindById;

      // Act
      const result = await authService.verifyToken(mockToken);

      // Assert
      expect(mockedJwt.verify).toHaveBeenCalledWith(mockToken, config.jwtSecret);
      expect(mockFindById).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockJwtPayload);
    });

    it('debería lanzar UnauthorizedError si el usuario no existe', async () => {
      // Arrange
      mockedJwt.verify.mockReturnValue(mockJwtPayload as never);
      const mockFindById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });
      mockedUser.findById = mockFindById;

      // Act & Assert
      await expect(authService.verifyToken(mockToken)).rejects.toThrow(UnauthorizedError);
      expect(mockFindById).toHaveBeenCalledWith(mockUserId);
    });

    it('debería lanzar UnauthorizedError si el token es inválido', async () => {
      // Arrange
      const error = new jwt.JsonWebTokenError('invalid token');
      mockedJwt.verify.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      await expect(authService.verifyToken(mockToken)).rejects.toThrow(UnauthorizedError);
      expect(mockedJwt.verify).toHaveBeenCalledWith(mockToken, config.jwtSecret);
    });

    it('debería lanzar UnauthorizedError si el token está expirado', async () => {
      // Arrange
      const error = new jwt.TokenExpiredError('jwt expired', new Date());
      mockedJwt.verify.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      await expect(authService.verifyToken(mockToken)).rejects.toThrow(UnauthorizedError);
      expect(mockedJwt.verify).toHaveBeenCalledWith(mockToken, config.jwtSecret);
    });

    it('debería relanzar otros tipos de errores', async () => {
      // Arrange
      const error = new Error('Some other error');
      mockedJwt.verify.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      await expect(authService.verifyToken(mockToken)).rejects.toThrow('Some other error');
    });
  });

  describe('generateToken', () => {
    it('debería generar un token JWT válido', () => {
      // Arrange
      const payload = {
        userId: mockUserId,
        email: mockEmail,
        role: 'usuario'
      };
      mockedJwt.sign.mockReturnValue(mockToken as never);

      // Act
      const result = authService.generateToken(payload);

      // Assert
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        {
          userId: mockUserId,
          email: mockEmail,
          roles: 'usuario'
        },
        config.jwtSecret,
        { expiresIn: '7d' }
      );
      expect(result).toBe(mockToken);
    });

    it('debería manejar rol de superadmin', () => {
      // Arrange
      const payload = {
        userId: mockUserId,
        email: mockEmail,
        role: 'superadmin'
      };
      mockedJwt.sign.mockReturnValue(mockToken as never);

      // Act
      const result = authService.generateToken(payload);

      // Assert
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        {
          userId: mockUserId,
          email: mockEmail,
          roles: 'superadmin'
        },
        config.jwtSecret,
        { expiresIn: '7d' }
      );
      expect(result).toBe(mockToken);
    });
  });

  describe('JWTService (compatibilidad)', () => {
    it('debería funcionar generateToken a través de JWTService', () => {
      // Arrange
      const payload = {
        userId: mockUserId,
        email: mockEmail,
        role: 'usuario'
      };
      mockedJwt.sign.mockReturnValue(mockToken as never);

      // Act
      const result = JWTService.generateToken(payload);

      // Assert
      expect(result).toBe(mockToken);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        {
          userId: mockUserId,
          email: mockEmail,
          roles: 'usuario'
        },
        config.jwtSecret,
        { expiresIn: '7d' }
      );
    });

    it('debería funcionar verifyToken a través de JWTService', async () => {
      // Arrange
      mockedJwt.verify.mockReturnValue(mockJwtPayload as never);
      mockedUser.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser)
      });

      // Act
      const result = await JWTService.verifyToken(mockToken);

      // Assert
      expect(result).toEqual(mockJwtPayload);
      expect(mockedJwt.verify).toHaveBeenCalledWith(mockToken, config.jwtSecret);
      expect(mockedUser.findById).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('Integración - casos de uso completos', () => {
    it('debería manejar el flujo completo de registro y login', async () => {
      // Arrange - Register
      mockedUser.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });
      mockedBcrypt.hash.mockResolvedValue(mockHashedPassword as never);
      
      const mockSave = jest.fn().mockResolvedValue({
        toObject: jest.fn().mockReturnValue(mockUser)
      });
      mockedUser.mockReturnValueOnce({ save: mockSave });

      // Act - Register
      const registerResult = await authService.register(mockRegisterData);

      // Assert - Register
      expect(registerResult.email).toBe(mockEmail);
      expect(registerResult.roles).toBe('usuario');

      // Arrange - Login
      mockedUser.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockUserWithPassword)
        })
      });
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedJwt.sign.mockReturnValue(mockToken as never);

      // Act - Login
      const loginResult = await authService.login(mockLoginData);

      // Assert - Login
      expect(loginResult.token).toBe(mockToken);
      expect(loginResult.email).toBe(mockEmail);
    });

    it('debería validar token generado en login', async () => {
      // Arrange - Login primero
      mockedUser.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockUserWithPassword)
        })
      });
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedJwt.sign.mockReturnValue(mockToken as never);

      const loginResult = await authService.login(mockLoginData);

      // Arrange - Verify token
      mockedJwt.verify.mockReturnValue(mockJwtPayload as never);
      mockedUser.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser)
      });

      // Act - Verify
      const verifyResult = await authService.verifyToken(loginResult.token);

      // Assert
      expect(verifyResult.userId).toBe(mockUserId);
      expect(verifyResult.email).toBe(mockEmail);
      expect(verifyResult.roles).toBe('usuario');
    });
  });
});