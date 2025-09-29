// Setup global para Jest
import 'dotenv/config';

// Mock de variables de entorno para las pruebas
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.BCRYPT_SALT_ROUNDS = '10';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';

// Configuración global para los tests
jest.setTimeout(30000);

// Mock global de console para evitar logs durante las pruebas
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};