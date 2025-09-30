# 🚀 Guía de Despliegue - Proyecto Node Express

## Despliegue en Railway (Recomendado para proyectos académicos)

### Prerrequisitos
- Cuenta en [Railway.app](https://railway.app) (gratis)
- Cuenta en [GitHub](https://github.com)
- Tu proyecto debe estar en un repositorio de GitHub

### Paso a paso para desplegar:

#### 1. Preparar el repositorio
```bash
# Asegúrate de estar en la rama deploy-setup
git add .
git commit -m "feat: configuración para despliegue en Railway"
git push origin deploy-setup
```

#### 2. Desplegar en Railway
1. Ve a [railway.app](https://railway.app) y haz login con GitHub
2. Haz clic en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Elige tu repositorio `proyecto-node-express`
5. Selecciona la rama `deploy-setup`

#### 3. Configurar la base de datos
1. En Railway, haz clic en "Add service" → "Database" → "MongoDB"
2. Railway creará automáticamente una base de datos MongoDB

#### 4. Configurar variables de entorno
En Railway, ve a tu servicio y agrega estas variables:
- `MONGO_URI`: Se generará automáticamente cuando conectes MongoDB
- `JWT_SECRET`: `mi_super_secreto_jwt_key_academico_2024`
- `NODE_ENV`: `production`
- `PORT`: `3000` (Railway lo maneja automáticamente)

#### 5. ¡Listo! 🎉
Railway automáticamente:
- Detectará que usas Bun
- Instalará las dependencias
- Ejecutará `bun start`
- Te dará una URL pública

### URLs importantes después del despliegue:
- Tu API estará en: `https://tu-proyecto.railway.app`
- Endpoints principales:
  - `GET /api/health` - Verificar que la API funciona
  - `POST /api/auth/register` - Registro de usuarios
  - `POST /api/auth/login` - Login de usuarios

### Alternativas de despliegue gratuitas:
1. **Render.com** - Similar a Railway
2. **Vercel** - Para frontend principalmente
3. **Heroku** - Con limitaciones en plan gratuito

### Comandos útiles para desarrollo:
```bash
# Desarrollo local
bun dev

# Ejecutar tests
bun test

# Build para producción
bun run build

# Vista previa del build
bun run preview
```

### Troubleshooting común:
- **Error de conexión a MongoDB**: Verifica las variables de entorno
- **Error 502**: El servidor puede estar iniciando, espera 1-2 minutos
- **Variables de entorno**: Asegúrate de que todas estén configuradas en Railway

### Contacto del proyecto:
Este es un proyecto académico desarrollado con:
- **Backend**: Node.js + Express + TypeScript
- **Runtime**: Bun
- **Base de datos**: MongoDB
- **Despliegue**: Railway

¡Tu API estará disponible 24/7 de forma gratuita! 🚀