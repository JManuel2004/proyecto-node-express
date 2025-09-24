import { Request } from 'express';

export interface IUser {
  _id?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'superadmin' | 'usuario';
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'superadmin' | 'usuario';
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: 'superadmin' | 'usuario';
  isActive?: boolean;
}