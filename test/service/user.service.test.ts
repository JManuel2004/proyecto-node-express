import { UserService } from '../../src/services/user.service';
import { User } from '../../src/models';
import { JWTService } from '../../src/services/jwt.service';
import {
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  BadRequestError
} from '../../src/middleware/error';
import { RegisterRequest, LoginRequest, UpdateUserRequest } from '../../src/types';

// Mock de las dependencias
jest.mock('../../src/models');
jest.mock('../../src/services/jwt.service');

const mockedUser = User as jest.Mocked<typeof User>;
const mockedJWTService = JWTService as jest.Mocked<typeof JWTService>;

describe('UserService', () => {
  // Datos de prueba
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'Juan',
    lastName: 'Pérez',
    role: 'usuario' as const,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
    comparePassword: jest.fn()
  };

  const mockRegisterData: RegisterRequest = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Juan',
    lastName: 'Pérez'
  };

  const mockLoginData: LoginRequest = {
    email: 'test@example.com',
    password: 'password123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('debería registrar un nuevo usuario exitosamente', async () => {
      // Arrange
      mockedUser.findOne.mockResolvedValue(null);
      mockedUser.prototype.save = jest.fn().mockResolvedValue(mockUser);
      mockedJWTService.generateToken.mockReturnValue('mock-token');

      // Mock del constructor
      const mockUserInstance = {
        ...mockUser,
        save: jest.fn().mockResolvedValue(mockUser)
      };
      (mockedUser as any).mockImplementation(() => mockUserInstance);

      // Act
      const result = await UserService.register(mockRegisterData);

      // Assert
      expect(mockedUser.findOne).toHaveBeenCalledWith({ email: mockRegisterData.email });
      expect(mockedJWTService.generateToken).toHaveBeenCalledWith({
        userId: mockUser._id.toString(),
        email: mockUser.email,
        role: mockUser.role
      });
      expect(result).toEqual({
        user: {
          _id: mockUser._id.toString(),
          email: mockUser.email,
          password: '',
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
          isActive: mockUser.isActive
        },
        token: 'mock-token'
      });
    });

    it('debería lanzar ConflictError si el email ya existe', async () => {
      // Arrange
      mockedUser.findOne.mockResolvedValue(mockUser as any);

      // Act & Assert
      await expect(UserService.register(mockRegisterData))
        .rejects
        .toThrow(new ConflictError('El email ya está registrado'));
    });
  });

  describe('login', () => {
    it('debería hacer login exitosamente con credenciales válidas', async () => {
      // Arrange
      const mockUserWithPassword = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(true)
      };
      mockedUser.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserWithPassword)
      } as any);
      mockedJWTService.generateToken.mockReturnValue('mock-token');

      // Act
      const result = await UserService.login(mockLoginData);

      // Assert
      expect(mockedUser.findOne).toHaveBeenCalledWith({ email: mockLoginData.email });
      expect(mockUserWithPassword.comparePassword).toHaveBeenCalledWith(mockLoginData.password);
      expect(result).toEqual({
        user: {
          email: mockUser.email,
          password: '',
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
          isActive: mockUser.isActive
        },
        token: 'mock-token'
      });
    });

    it('debería lanzar UnauthorizedError si el usuario no existe', async () => {
      // Arrange
      mockedUser.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      } as any);

      // Act & Assert
      await expect(UserService.login(mockLoginData))
        .rejects
        .toThrow(new UnauthorizedError('Credenciales inválidas'));
    });

    it('debería lanzar UnauthorizedError si la cuenta está desactivada', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      mockedUser.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(inactiveUser)
      } as any);

      // Act & Assert
      await expect(UserService.login(mockLoginData))
        .rejects
        .toThrow(new UnauthorizedError('Cuenta desactivada. Contacte al administrador'));
    });

    it('debería lanzar UnauthorizedError si la contraseña es incorrecta', async () => {
      // Arrange
      const mockUserWithPassword = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      mockedUser.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserWithPassword)
      } as any);

      // Act & Assert
      await expect(UserService.login(mockLoginData))
        .rejects
        .toThrow(new UnauthorizedError('Credenciales inválidas'));
    });
  });

  describe('getProfile', () => {
    it('debería obtener el perfil del usuario exitosamente', async () => {
      // Arrange
      mockedUser.findById.mockResolvedValue(mockUser as any);

      // Act
      const result = await UserService.getProfile(mockUser._id);

      // Assert
      expect(mockedUser.findById).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual({
        _id: mockUser._id.toString(),
        email: mockUser.email,
        password: '',
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        isActive: mockUser.isActive,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt
      });
    });

    it('debería lanzar NotFoundError si el usuario no existe', async () => {
      // Arrange
      mockedUser.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(UserService.getProfile('nonexistent-id'))
        .rejects
        .toThrow(new NotFoundError('Usuario no encontrado'));
    });
  });

  describe('getAllUsers', () => {
    it('debería obtener todos los usuarios con paginación', async () => {
      // Arrange
      const mockUsers = [mockUser, { ...mockUser, _id: 'another-id' }];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockUsers)
      };
      mockedUser.find.mockReturnValue(mockQuery as any);
      mockedUser.countDocuments.mockResolvedValue(10);

      // Act
      const result = await UserService.getAllUsers(1, 5);

      // Assert
      expect(mockedUser.find).toHaveBeenCalled();
      expect(mockQuery.select).toHaveBeenCalledWith('-password');
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(result).toEqual({
        users: mockUsers,
        pagination: {
          currentPage: 1,
          totalPages: 2,
          totalUsers: 10,
          hasNextPage: true,
          hasPrevPage: false
        }
      });
    });
  });

  describe('createUser', () => {
    it('debería crear un usuario exitosamente', async () => {
      // Arrange
      mockedUser.findOne.mockResolvedValue(null);
      const mockUserInstance = {
        ...mockUser,
        save: jest.fn().mockResolvedValue(mockUser)
      };
      (mockedUser as any).mockImplementation(() => mockUserInstance);

      // Act
      const result = await UserService.createUser(mockRegisterData);

      // Assert
      expect(mockedUser.findOne).toHaveBeenCalledWith({ email: mockRegisterData.email });
      expect(result).toEqual({
        user: {
          _id: mockUser._id.toString(),
          email: mockUser.email,
          password: '',
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
          isActive: mockUser.isActive,
          createdAt: mockUser.createdAt
        }
      });
    });

    it('debería lanzar ConflictError si el email ya existe', async () => {
      // Arrange
      mockedUser.findOne.mockResolvedValue(mockUser as any);

      // Act & Assert
      await expect(UserService.createUser(mockRegisterData))
        .rejects
        .toThrow(new ConflictError('El email ya está registrado'));
    });
  });

  describe('updateUser', () => {
    it('debería actualizar un usuario exitosamente', async () => {
      // Arrange
      const updateData: UpdateUserRequest = {
        firstName: 'NuevoNombre',
        lastName: 'NuevoApellido'
      };
      const updatedUser = { ...mockUser, ...updateData };
      mockedUser.findByIdAndUpdate.mockResolvedValue(updatedUser as any);

      // Act
      const result = await UserService.updateUser(mockUser._id, updateData);

      // Assert
      expect(mockedUser.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        updateData,
        { new: true, runValidators: true }
      );
      expect(result).toEqual({
        user: {
          _id: updatedUser._id.toString(),
          email: updatedUser.email,
          password: '',
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
          updatedAt: updatedUser.updatedAt
        }
      });
    });

    it('debería eliminar el campo password si está en las actualizaciones', async () => {
      // Arrange
      const updateData = {
        firstName: 'NuevoNombre',
        password: 'newPassword'
      } as any;
      const updatedUser = { ...mockUser, firstName: 'NuevoNombre' };
      mockedUser.findByIdAndUpdate.mockResolvedValue(updatedUser as any);

      // Act
      await UserService.updateUser(mockUser._id, updateData);

      // Assert
      expect(mockedUser.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        { firstName: 'NuevoNombre' },
        { new: true, runValidators: true }
      );
    });

    it('debería lanzar NotFoundError si el usuario no existe', async () => {
      // Arrange
      mockedUser.findByIdAndUpdate.mockResolvedValue(null);

      // Act & Assert
      await expect(UserService.updateUser('nonexistent-id', { firstName: 'Test' }))
        .rejects
        .toThrow(new NotFoundError('Usuario no encontrado'));
    });
  });

  describe('deleteUser', () => {
    it('debería eliminar un usuario exitosamente', async () => {
      // Arrange
      const userIdToDelete = 'user-to-delete';
      const currentUserId = 'current-user';
      mockedUser.findByIdAndDelete.mockResolvedValue(mockUser as any);

      // Act
      await UserService.deleteUser(userIdToDelete, currentUserId);

      // Assert
      expect(mockedUser.findByIdAndDelete).toHaveBeenCalledWith(userIdToDelete);
    });

    it('debería lanzar BadRequestError si trata de eliminar su propia cuenta', async () => {
      // Arrange
      const userId = 'same-user-id';

      // Act & Assert
      await expect(UserService.deleteUser(userId, userId))
        .rejects
        .toThrow(new BadRequestError('No puedes eliminar tu propia cuenta'));
    });

    it('debería lanzar NotFoundError si el usuario no existe', async () => {
      // Arrange
      mockedUser.findByIdAndDelete.mockResolvedValue(null);

      // Act & Assert
      await expect(UserService.deleteUser('nonexistent-id', 'current-user'))
        .rejects
        .toThrow(new NotFoundError('Usuario no encontrado'));
    });
  });

  describe('getUserById', () => {
    it('debería obtener un usuario por ID exitosamente', async () => {
      // Arrange
      mockedUser.findById.mockResolvedValue(mockUser as any);

      // Act
      const result = await UserService.getUserById(mockUser._id);

      // Assert
      expect(mockedUser.findById).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual({
        _id: mockUser._id.toString(),
        email: mockUser.email,
        password: '',
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        isActive: mockUser.isActive,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt
      });
    });

    it('debería lanzar NotFoundError si el usuario no existe', async () => {
      // Arrange
      mockedUser.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(UserService.getUserById('nonexistent-id'))
        .rejects
        .toThrow(new NotFoundError('Usuario no encontrado'));
    });
  });

  describe('checkUserPermission', () => {
    it('debería retornar true para superadmin', async () => {
      // Act
      const result = await UserService.checkUserPermission('user1', 'user2', 'superadmin');

      // Assert
      expect(result).toBe(true);
    });

    it('debería retornar true si userId coincide con targetUserId', async () => {
      // Act
      const result = await UserService.checkUserPermission('user1', 'user1', 'usuario');

      // Assert
      expect(result).toBe(true);
    });

    it('debería retornar false si userId no coincide con targetUserId y no es superadmin', async () => {
      // Act
      const result = await UserService.checkUserPermission('user1', 'user2', 'usuario');

      // Assert
      expect(result).toBe(false);
    });
  });
});