import { User } from '../models';

export const createSuperAdmin = async (): Promise<void> => {
  try {
    console.log('[AUTH] Verificando superadmin...');
    
    // Verificar 
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    
    if (existingSuperAdmin) {
      console.log('[AUTH] Superadmin existente:', existingSuperAdmin.email);
      return;
    }

    console.log('[AUTH] Creando superadmin...');
    
    // Crear 
    const superAdmin = new User({
      email: 'admin@proyecto.com',
      password: 'Admin123!',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'superadmin',
      isActive: true
    });

    await superAdmin.save();
    
    console.log('[AUTH] Superadmin creado');
    console.log('[AUTH] Email: admin@proyecto.com');
    console.log('[AUTH] Password: Admin123!');
    console.log('[WARN] Cambiar contraseña después del primer login');
    
  } catch (error: any) {
    console.log('[ERROR] Error creando superadmin:', error.message || error);
  }
};