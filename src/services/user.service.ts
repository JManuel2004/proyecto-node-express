import { User } from '../models';
import { JWTService } from './jwt.service';
import { 
  NotFoundError, 
  ConflictError, 
  UnauthorizedError, 
  ForbiddenError,
  BadRequestError 
} from '../middleware/error';
import { RegisterRequest, LoginRequest, UpdateUserRequest, IUser } from '../types';

export class UserService {
 
  static async register(userData: RegisterRequest): Promise<{ user: IUser; token: string }> {
    const { email, password, firstName, lastName } = userData;

    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('El email ya está registrado');
    }

   
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role: 'usuario'
    });

    await user.save();


    const token = JWTService.generateToken({
      userId: (user._id as string).toString(),
      email: user.email,
      role: user.role
    });

    return {
      user: {
        _id: user._id?.toString(),
        email: user.email,
        password: '',
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      },
      token
    };
  }


  static async login(loginData: LoginRequest): Promise<{ user: IUser; token: string }> {
    const { email, password } = loginData;

   
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    
    if (!user.isActive) {
      throw new UnauthorizedError('Cuenta desactivada. Contacte al administrador');
    }

   
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

  
    const token = JWTService.generateToken({
      userId: (user._id as string).toString(),
      email: user.email,
      role: user.role
    });

    return {
      user: {
        email: user.email,
        password: '', 
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      },
      token
    };
  }


  static async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    return {
      _id: user._id?.toString(),
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

 
  static async getAllUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments()
    ]);

    return {
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    };
  }


  static async createUser(userData: RegisterRequest & { role?: 'superadmin' | 'usuario' }): Promise<{ user: IUser }> {
    const { email, password, firstName, lastName, role = 'usuario' } = userData;

  
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('El email ya está registrado');
    }

   
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role
    });

    await user.save();

    return {
      user: {
        _id: user._id?.toString(),
        email: user.email,
        password: '',
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    };
  }


  static async updateUser(id: string, updates: UpdateUserRequest): Promise<{ user: IUser }> {
   
    if ('password' in updates) {
      delete (updates as any).password;
    }

    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    return {
      user: {
        _id: user._id?.toString(),
        email: user.email,
        password: '',
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        updatedAt: user.updatedAt
      }
    };
  }

 
  static async deleteUser(id: string, currentUserId: string): Promise<void> {
  
    if (id === currentUserId) {
      throw new BadRequestError('No puedes eliminar tu propia cuenta');
    }

    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }
  }

 
  static async getUserById(id: string): Promise<IUser> {
    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    return {
      _id: user._id?.toString(),
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

 
  static async checkUserPermission(userId: string, targetUserId: string, userRole: string): Promise<boolean> {
    if (userRole === 'superadmin') return true;
    
    return userId === targetUserId;
  }
}