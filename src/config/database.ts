import mongoose from 'mongoose';
import { config } from './index';

const connectDB = async (): Promise<void> => {
  try {
    // Configuraciones para evitar warnings y mejorar la conexión
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    };
    
    const conn = await mongoose.connect(config.mongoUri, options);
    
    console.log(`[DB] MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(' Error conectando a MongoDB:', error);
    console.log(' Asegúrate de que MongoDB esté corriendo en tu sistema');
    console.log(' Puedes iniciar MongoDB con: mongod');
    process.exit(1);
  }
};


export default connectDB;
