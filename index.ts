import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './src/config/database';
import routes from './src/routes';
import { errorHandler, notFound } from './src/middleware';
import { createSuperAdmin } from './src/utils';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Límite de requests por ventana de tiempo
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Middlewares de seguridad
app.use(helmet());
app.use(cors());
app.use(limiter);

// Middlewares de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ruta de salud del servidor
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Backend - Sistema de Usuarios',
    version: '1.0.0',
    endpoints: {
      auth: '/api/users/login',
      register: '/api/users/register',
      profile: '/api/users/profile',
      users: '/api/users'
    }
  });
});

// Rutas de la API
app.use('/api', routes);

// Middleware para rutas no encontradas
app.use(notFound);

// Middleware de manejo de errores
app.use(errorHandler);

// Función para inicializar el servidor
const startServer = async (): Promise<void> => {
  try {
    console.log('[INIT] Iniciando servidor...');
    
    // Intentar conectar a MongoDB
    try {
      await connectDB();
      
      // Solo crear superadmin si MongoDB está conectado
      await createSuperAdmin();
    } catch (dbError: any) {
      console.log('[WARN] Iniciando sin base de datos - algunos endpoints no funcionarán');
    }
    
    // Iniciar el servidor (siempre se inicia, con o sin DB)
    app.listen(PORT, () => {
      console.log(`[SERVER] http://localhost:${PORT}`);
      console.log(`[ENV] ${process.env.NODE_ENV || 'development'}`);
    });
    
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
};

// Iniciar el servidor
startServer();

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
