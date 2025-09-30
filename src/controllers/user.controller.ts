import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AuthRequest, LoginRequest, RegisterRequest, UpdateUserRequest } from '../types';
import { UnauthorizedError, BadRequestError } from '../middleware/error';

export class UserController {
  
  
  static async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        throw new UnauthorizedError('Usuario no autenticado');
      }

      const user = await UserService.getProfile(userId);

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  
  static async getAllUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await UserService.getAllUsers(page, limit);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  
  static async createUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData: RegisterRequest & { role?: 'superadmin' | 'usuario' } = req.body;
      const result = await UserService.createUser(userData);

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }


  static async updateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new BadRequestError('Falta el parámetro id'); 
      }

      const updates: UpdateUserRequest = req.body;
      const result = await UserService.updateUser(id, updates);

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }


  static async deleteUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      
      if (!id || !userId) {
        throw new BadRequestError('Faltan parámetros requeridos');
      }

      await UserService.deleteUser(id, userId);

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

 
  static async getUserById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new BadRequestError('Falta el parámetro id');
      }

      const user = await UserService.getUserById(id);

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }
}