import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/jwt.service';
import { UserLoginInput, RegisterRequest } from '../types';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const loginData: UserLoginInput = req.body;
      const result = await authService.login(loginData);
      
      res.json({
        success: true,
        message: 'Login exitoso',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const registerData: RegisterRequest = req.body;
      const result = await authService.register(registerData);
      
      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyToken(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Token requerido'
        });
      }

      const token = authHeader.substring(7);
      const decoded = await authService.verifyToken(token);
      
      res.json({
        success: true,
        message: 'Token válido',
        data: decoded
      });
    } catch (error) {
      next(error);
    }
  }
}