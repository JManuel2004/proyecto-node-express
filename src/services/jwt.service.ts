import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

export class JWTService {
  private static readonly secret: string = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
  private static readonly expiresIn: string = process.env.JWT_EXPIRES_IN || '7d';
  private static readonly refreshExpiresIn: string = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.secret, { 
      expiresIn: this.expiresIn 
    });
  }

  static generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.secret, { 
      expiresIn: this.refreshExpiresIn 
    });
  }

  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.secret) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token inválido');
      } else if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expirado');
      }
      throw new Error('Error al verificar token');
    }
  }

  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      return null;
    }
  }
}