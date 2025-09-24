import { Request, Response, NextFunction } from 'express';
import { User } from '../models';
import { JWTService } from '../services';
import { AppError } from '../middleware';
import { AuthRequest, LoginRequest, RegisterRequest, UpdateUserRequest } from '../types';

export class UserController {
  // Registro de nuevo usuario (solo superadmin puede crear usuarios)
  static async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, firstName, lastName }: RegisterRequest = req.body;

      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new AppError('El email ya está registrado', 400);
      }

      // Crear nuevo usuario (por defecto será 'usuario' regular)
      const user = new User({
        email,
        password,
        firstName,
        lastName,
        role: 'usuario' // Por defecto usuario regular
      });

      await user.save();

      // Generar token JWT
      const token = JWTService.generateToken({
        userId: (user._id as string).toString(),
        email: user.email,
        role: user.role
      });

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive
          },
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Login de usuario
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body;

      // Buscar usuario por email
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        throw new AppError('Credenciales inválidas', 401);
      }

      // Verificar si el usuario está activo
      if (!user.isActive) {
        throw new AppError('Cuenta desactivada. Contacte al administrador', 401);
      }

      // Verificar contraseña
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new AppError('Credenciales inválidas', 401);
      }

      // Generar token JWT
      const token = JWTService.generateToken({
        userId: (user._id as string).toString(),
        email: user.email,
        role: user.role
      });

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive
          },
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener perfil del usuario autenticado
  static async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener todos los usuarios (solo superadmin)
  static async getAllUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        User.find()
          .select('-password')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        User.countDocuments()
      ]);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalUsers: total,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Crear usuario (solo superadmin)
  static async createUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, firstName, lastName, role = 'usuario' }: RegisterRequest & { role?: 'superadmin' | 'usuario' } = req.body;

      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new AppError('El email ya está registrado', 400);
      }

      // Crear nuevo usuario
      const user = new User({
        email,
        password,
        firstName,
        lastName,
        role
      });

      await user.save();

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar usuario (solo superadmin)
  static async updateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updates: UpdateUserRequest = req.body;

      // No permitir actualizar la contraseña a través de este endpoint
      if ('password' in updates) {
        delete (updates as any).password;
      }

      const user = await User.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            updatedAt: user.updatedAt
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar usuario (solo superadmin)
  static async deleteUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // No permitir que un superadmin se elimine a sí mismo
      if (id === req.user?.userId) {
        throw new AppError('No puedes eliminar tu propia cuenta', 400);
      }

      const user = await User.findByIdAndDelete(id);
      
      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener usuario por ID (solo superadmin)
  static async getUserById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const user = await User.findById(id);
      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}