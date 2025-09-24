
db = db.getSiblingDB('proyecto_backend');


db.createUser({
  user: 'app_user',
  pwd: 'app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'proyecto_backend'
    }
  ]
});

// Crear colección de usuarios con índice único en email
db.createCollection('users');
db.users.createIndex({ "email": 1 }, { unique: true });

print(' Base de datos proyecto_backend inicializada correctamente');
print(' Usuario de aplicación: app_user');
print('Contraseña: app_password');
print(' Base de datos: proyecto_backend');