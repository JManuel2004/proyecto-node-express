import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/proyecto_backend',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
  nodeEnv: process.env.NODE_ENV || 'development'
};