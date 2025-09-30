# 🚀 Sistema de Gestión de Proyectos y Tareas

## 📋 Descripción del Proyecto

API RESTful desarrollada en **Node.js con TypeScript** para la gestión de proyectos y tareas, con sistema de autenticación JWT y control de permisos por roles. Permite a los usuarios crear, gestionar y organizar proyectos y tareas de manera eficiente.

## ✨ Funcionalidades Principales

### 🔐 Autenticación y Autorización
- **Registro y login de usuarios** con validación de datos
- **Tokens JWT** para autenticación segura
- **Sistema de roles**: `superadmin` y `usuario`
- **Middleware de autorización** para proteger endpoints

### 👥 Gestión de Usuarios
- **Superadmin** puede crear, modificar y eliminar usuarios
- **Usuarios regulares** pueden ver y gestionar su perfil
- **Validaciones** de email, contraseña y datos personales

### 📊 Gestión de Proyectos
- **CRUD completo** de proyectos
- **Filtros** por estado, fecha y propietario
- **Estadísticas** de proyectos por estado
- **Permisos**: Usuarios solo ven/modifican sus proyectos

### ✅ Gestión de Tareas
- **CRUD completo** de tareas vinculadas a proyectos
- **Estados**: `todo`, `in_progress`, `done`
- **Prioridades**: `low`, `medium`, `high`
- **Asignación** de tareas a usuarios específicos

## 🛠 Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **TypeScript** - Tipado estático
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación por tokens
- **bcryptjs** - Encriptación de contraseñas

### Desarrollo y Calidad
- **Jest** - Framework de testing
- **Express Validator** - Validación de datos
- **Helmet** - Seguridad de headers
- **CORS** - Control de acceso HTTP
- **Rate Limiting** - Protección contra ataques

## 📋 Requisitos Previos

- **Node.js** v18 o superior
- **MongoDB** v5.0 o superior
- **Bun** v1.0 o superior (opcional, puede usarse npm)

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone <url-del-repositorio>
cd proyecto-backend

## 2. Instalar Dependencias

# Con Bun (recomendado)
bun install

# O con npm
npm install
```

---


## 2. Configurar Variables de Entorno

1. Copiar el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Editar el archivo `.env` y completar los valores con tus credenciales.

## 3. Configurar Base de Datos


La base de datos se **dockerizó** para facilitar su despliegue y gestión.

```bash
# Levantar MongoDB usando Docker
docker-compose up -d

# Verificar que el contenedor esté corriendo
docker ps
```

> **Nota:** Si prefieres correr MongoDB localmente sin Docker:
```bash
mongod
```

## 4. Ejecutar la Aplicación

```bash
# Desarrollo con Bun
bun run dev

# O con npm
npm run dev


El servidor estará disponible en:  
**http://localhost:3000**

---

## 🧪 Ejecución de Pruebas

### Pruebas Unitarias e Integración
```bash
# Ejecutar todas las pruebas
bun test

# Ejecutar pruebas con cobertura
bun test --coverage

# Ejecutar en modo watch
bun test --watch

# Pruebas específicas
bun test test/service/user.service.test.ts
```

### Pruebas con Postman
- Importar la colección de Postman incluida en el proyecto.
- Configurar variables de entorno en Postman:
  - **baseUrl:** `http://localhost:3000/api`
  - **token:** (se autogenera al hacer login)

---

## 📁 Estructura del Proyecto
```text
src/
├── config/           # Configuración de base de datos
├── controllers/      # Lógica de endpoints
├── middleware/       # Autenticación, validación, errores
├── models/           # Esquemas de MongoDB
├── routes/           # Definición de rutas
├── services/         # Lógica de negocio
├── types/            # Definiciones TypeScript
└── utils/            # Utilidades (creación de superadmin)

test/                 # Pruebas automatizadas
├── controller/       # Pruebas de controladores
├── middleware/       # Pruebas de middleware
└── service/          # Pruebas de servicios
```

---

## 🌐 Endpoints de la API

### **Autenticación**
- `POST /api/users/register` - Registrar nuevo usuario  
- `POST /api/users/login` - Iniciar sesión  

### **Usuarios (Requieren autenticación)**
- `GET /api/users/profile` - Perfil del usuario actual  
- `GET /api/users` - Listar usuarios (solo superadmin)  
- `POST /api/users` - Crear usuario (solo superadmin)  
- `PUT /api/users/:id` - Actualizar usuario (solo superadmin)  
- `DELETE /api/users/:id` - Eliminar usuario (solo superadmin)  

### **Proyectos (Requieren autenticación)**
- `POST /api/projects` - Crear proyecto  
- `GET /api/projects` - Listar proyectos (filtrados por permisos)  
- `GET /api/projects/my-projects` - Proyectos del usuario actual  
- `GET /api/projects/stats` - Estadísticas de proyectos  
- `GET /api/projects/:id` - Obtener proyecto por ID  
- `PUT /api/projects/:id` - Actualizar proyecto  
- `DELETE /api/projects/:id` - Eliminar proyecto  

### **Tareas (Requieren autenticación)**
- `POST /api/tasks` - Crear tarea  
- `GET /api/tasks` - Listar tareas (con filtros)  
- `GET /api/tasks/project/:projectId` - Tareas de un proyecto  
- `GET /api/tasks/:id` - Obtener tarea por ID  
- `PUT /api/tasks/:id` - Actualizar tarea  
- `DELETE /api/tasks/:id` - Eliminar tarea  

---

## 🔐 Usuario por Defecto
Al iniciar la aplicación se crea automáticamente un usuario superadmin:

- **Email:** `admin@proyecto.com`  
- **Password:** `Admin123!`  



## 🐛 Dificultades Encontradas

1. **Gestión de Permisos Complejos**  
   - **Problema:** Implementar lógica donde usuarios solo ven sus proyectos/tareas.  
   - **Solución:** Middleware de autorización y filtros dinámicos en servicios.

2. **Relaciones entre Modelos**  
   - **Problema:** Mantener consistencia en referencias entre proyectos y tareas.  
   - **Solución:** Uso de `populate` de Mongoose y validaciones de existencia.

3. **Validaciones Anidadas**  
   - **Problema:** Validar que fechas de tareas estén dentro del rango del proyecto.  
   - **Solución:** Validaciones personalizadas en servicios.

4. **Testing con TypeScript**  
   - **Problema:** Configurar mocks correctamente con tipos TypeScript.  
   - **Solución:** Uso de `jest.Mocked` y tipado estricto en tests.

---

