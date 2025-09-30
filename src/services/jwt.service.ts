import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../models';
import {
  UserLoginInput,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  JwtCustomPayload,
  UserRole,
} from '../types';
import { UnauthorizedError, ConflictError } from '../middleware/error';

class AuthService {
  private readonly saltRounds = 12;
  private readonly jwtExpiresIn = '7d';

  async login(loginData: UserLoginInput): Promise<LoginResponse> {
    const { email, password } = loginData;

    const user = await User.findOne({ email, isActive: true }).select('+password').lean();
    if (!user) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Generar token JWT
    const token = this.generateToken({
      userId: user._id ? String(user._id) : '',
      email: user.email,
      role: user.role,
    });

    return {
      id: user._id ? String(user._id) : '',
      username: user.username || `${user.firstName} ${user.lastName}`,
      email: user.email,
      roles: user.role,
      token,
    };
  }

  async register(registerData: RegisterRequest): Promise<RegisterResponse> {
    const { firstName, lastName, email, password } = registerData;

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email, isActive: true }).lean();
    if (existingUser) {
      throw new ConflictError('El email ya está registrado');
    }

    // Crear usuario con la contraseña en texto plano (el modelo la hasheará)
    const user = new User({
      firstName,
      lastName,
      email,
      password: password, // El pre('save') del modelo User la hasheará
      role: UserRole.USER, // Solo usuarios regulares pueden registrarse
      isActive: true,
    });
    const savedUser = await user.save();
    const newUser = savedUser.toObject();

    return {
      id: newUser._id ? String(newUser._id) : '',
      username: newUser.username || `${newUser.firstName} ${newUser.lastName}`,
      email: newUser.email,
      roles: newUser.role,
    };
  }

  async verifyToken(token: string): Promise<JwtCustomPayload> {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JwtCustomPayload;

      // Verificar que el usuario aún existe
      const user = await User.findById(decoded.userId).lean();
      if (!user) {
        throw new UnauthorizedError('Usuario no encontrado');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Token inválido');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expirado');
      }
      throw error;
    }
  }

  // Método para generar token (compatibilidad con el sistema existente)
  generateToken(payload: { userId: string; email: string; role: string }): string {
    const jwtPayload: JwtCustomPayload = {
      userId: payload.userId,
      email: payload.email,
      roles: payload.role as 'superadmin' | 'usuario',
    };

    return jwt.sign(jwtPayload, config.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    });
  }
}

export const authService = new AuthService();

// Exportar también como JWTService para mantener compatibilidad
export const JWTService = {
  generateToken: (payload: { userId: string; email: string; role: string }) => {
    return authService.generateToken(payload);
  },
  verifyToken: (token: string) => {
    return authService.verifyToken(token);
  }
};
