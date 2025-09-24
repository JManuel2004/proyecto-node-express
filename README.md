# Sistema de Gestión de Usuarios - Backend API

API REST desarrollada con Node.js, TypeScript, Express y MongoDB para la gestión de usuarios con autenticación JWT y control de roles.

## 🚀 Características

- **Autenticación JWT**: Sistema seguro de autenticación con tokens
- **Control de Roles**: Superadmin y usuarios regulares
- **Validación de Datos**: Validación robusta con express-validator
- **Seguridad**: Implementación de helmet, CORS, rate limiting
- **Base de Datos**: MongoDB con Mongoose ODM
- **TypeScript**: Tipado fuerte para mayor seguridad

## 📋 Requisitos Previos

- Node.js (versión 16 o superior)
- Bun (runtime JavaScript)
- MongoDB (local o en la nube)

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd proyecto_node
```

2. **Instalar dependencias**
```bash
bun install
```

3. **Configurar variables de entorno**
Crear un archivo `.env` en la raíz del proyecto:
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/proyecto_backend

# JWT Configuration
JWT_SECRET=tu_jwt_secret_super_seguro_aqui_cambia_esto
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_SALT_ROUNDS=12
```

4. **Iniciar MongoDB**
Asegúrate de que MongoDB esté corriendo en tu sistema.

5. **Ejecutar la aplicación**
```bash
bun run index.ts
```

## 👤 Usuario Inicial

Al iniciar la aplicación por primera vez, se creará automáticamente un superadmin:

- **Email**: admin@proyecto.com
- **Contraseña**: Admin123!
- **Rol**: superadmin

⚠️ **IMPORTANTE**: Cambia esta contraseña después del primer login.

## 📚 API Endpoints

### 🔐 Autenticación

#### Registro de Usuario
```http
POST /api/users/register
Content-Type: application/json

{
  "email": "usuario@email.com",
  "password": "MiPassword123",
  "firstName": "Juan",
  "lastName": "Pérez"
}
```

#### Iniciar Sesión
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "usuario@email.com",
  "password": "MiPassword123"
}
```

### 👤 Gestión de Usuarios

#### Obtener Perfil (Usuario Autenticado)
```http
GET /api/users/profile
Authorization: Bearer <token>
```

#### Listar Todos los Usuarios (Solo Superadmin)
```http
GET /api/users?page=1&limit=10
Authorization: Bearer <token>
```

#### Crear Usuario (Solo Superadmin)
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "nuevo@email.com",
  "password": "Password123",
  "firstName": "Nuevo",
  "lastName": "Usuario",
  "role": "usuario"
}
```

#### Obtener Usuario por ID (Solo Superadmin)
```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### Actualizar Usuario (Solo Superadmin)
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Nombre Actualizado",
  "lastName": "Apellido Actualizado",
  "role": "superadmin",
  "isActive": false
}
```

#### Eliminar Usuario (Solo Superadmin)
```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

## 🔒 Roles y Permisos

### Usuario Regular (`usuario`)
- ✅ Registrarse en el sistema
- ✅ Iniciar sesión
- ✅ Ver su propio perfil
- ❌ Crear, modificar o eliminar otros usuarios
- ❌ Acceder a la lista de usuarios

### Superadministrador (`superadmin`)
- ✅ Todas las funciones de usuario regular
- ✅ Ver lista completa de usuarios
- ✅ Crear nuevos usuarios (incluyendo otros superadmins)
- ✅ Modificar cualquier usuario
- ✅ Eliminar usuarios (excepto su propia cuenta)
- ✅ Acceso completo a la API

## 📱 Ejemplos de Uso

### 1. Obtener Token de Autenticación
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@proyecto.com",
    "password": "Admin123!"
  }'
```

### 2. Usar Token para Acceder a Rutas Protegidas
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <tu_token_aqui>"
```

### 3. Crear un Nuevo Usuario (Como Superadmin)
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token_superadmin>" \
  -d '{
    "email": "nuevo@test.com",
    "password": "Password123",
    "firstName": "Test",
    "lastName": "User",
    "role": "usuario"
  }'
```

## 🛡️ Seguridad Implementada

- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **Helmet**: Headers de seguridad HTTP
- **CORS**: Control de acceso entre dominios
- **Validación de Entrada**: Sanitización y validación de datos
- **Hash de Contraseñas**: Bcrypt para encriptación
- **JWT Seguro**: Tokens con expiración configurable

## 📁 Estructura del Proyecto

```
src/
├── config/
│   └── database.ts          # Configuración de MongoDB
├── controllers/
│   ├── user.controller.ts    # Controlador de usuarios
│   └── index.ts
├── middleware/
│   ├── auth.ts              # Middleware de autenticación
│   ├── error.ts             # Manejo de errores
│   ├── validation.ts        # Validaciones
│   └── index.ts
├── models/
│   ├── User.ts              # Modelo de usuario
│   └── index.ts
├── routes/
│   ├── users.ts             # Rutas de usuarios
│   └── index.ts
├── services/
│   ├── jwt.service.ts       # Servicio JWT
│   └── index.ts
├── types/
│   └── index.ts             # Definiciones de tipos
└── utils/
    ├── createSuperAdmin.ts  # Utilidad para crear superadmin
    └── index.ts
```

## 🐛 Manejo de Errores

La API maneja los siguientes códigos de estado HTTP:

- `200` - OK
- `201` - Creado exitosamente
- `400` - Solicitud incorrecta / Errores de validación
- `401` - No autorizado / Token inválido
- `403` - Prohibido / Sin permisos suficientes
- `404` - Recurso no encontrado
- `429` - Demasiadas solicitudes (Rate limit)
- `500` - Error interno del servidor

## 🧪 Pruebas

Para probar la API, puedes usar herramientas como:
- **Postman**: Importa las rutas y prueba los endpoints
- **Thunder Client**: Extensión de VS Code
- **curl**: Desde la línea de comandos

## 📝 Notas de Desarrollo

- Las contraseñas deben tener al menos 6 caracteres con mayúsculas, minúsculas y números
- Los tokens JWT expiran en 7 días por defecto
- Rate limiting: 100 requests por 15 minutos por IP
- La aplicación crea automáticamente el superadmin inicial si no existe

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para la feature (`git checkout -b feature/NuevaFeature`)
3. Commit los cambios (`git commit -am 'Agregar nueva feature'`)
4. Push a la rama (`git push origin feature/NuevaFeature`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT.

---

Desarrollado con ❤️ para Computación en Internet III - Universidad Icesi
