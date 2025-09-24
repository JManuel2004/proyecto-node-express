import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/proyecto_backend';
    
    // Configuraciones para evitar warnings y mejorar la conexión
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    };
    
    const conn = await mongoose.connect(mongoURI, options);
    
    console.log(`[DB] MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    console.log('💡 Asegúrate de que MongoDB esté corriendo en tu sistema');
    console.log('💡 Puedes iniciar MongoDB con: mongod');
    process.exit(1);
  }
};

export default connectDB;