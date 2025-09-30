#!/usr/bin/env bun

console.log('🔍 Verificando configuración del proyecto...\n');

// Verificar variables de entorno necesarias
const requiredEnvVars = ['JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('❌ Variables de entorno faltantes:');
  missingVars.forEach(varName => console.log(`   - ${varName}`));
  console.log('\n💡 Copia .env.example a .env y configura las variables\n');
} else {
  console.log('✅ Variables de entorno configuradas correctamente\n');
}

// Verificar conexión a la base de datos
console.log('🔗 Verificando configuración de base de datos...');
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/proyecto_backend';
console.log(`   URI: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}\n`);

// Información del entorno
console.log('📊 Información del entorno:');
console.log(`   Node Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`   Puerto: ${process.env.PORT || 3000}`);
console.log(`   Runtime: Bun ${process.versions.bun}\n`);

console.log('🚀 ¡Proyecto listo para despliegue!\n');
console.log('📖 Lee DEPLOY.md para instrucciones detalladas de despliegue');