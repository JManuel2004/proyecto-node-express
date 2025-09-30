# 🚀 Despliegue en Render.com - Guía Completa

## ¿Por qué Render.com es perfecto para tu proyecto?
- ✅ **100% GRATUITO** para siempre (proyectos académicos)
- ✅ **Soporte nativo para Bun** (tu runtime favorito)
- ✅ **MongoDB Atlas gratis** incluida
- ✅ **SSL/HTTPS automático**
- ✅ **Despliegue automático** desde GitHub
- ✅ **No requiere tarjeta de crédito**
- ✅ **Logs en tiempo real**

---

## 📋 PASO A PASO (5 minutos):

### 🔸 **Paso 1: Subir código a GitHub**
```bash
git add .
git commit -m "feat: configuración optimizada para Render"
git push origin deploy-setup
```

### 🔸 **Paso 2: Crear cuenta en Render**
1. Ve a [render.com](https://render.com)
2. Haz clic en "Get Started for Free"
3. Regístrate con tu cuenta de GitHub

### 🔸 **Paso 3: Crear Web Service**
1. En tu dashboard de Render, clic en "New +"
2. Selecciona "Web Service"
3. Conecta tu repositorio GitHub `proyecto-node-express`
4. Selecciona la rama `deploy-setup`

### 🔸 **Paso 4: Configurar el servicio**
**Información básica:**
- **Name**: `tu-proyecto-backend` (o el nombre que prefieras)
- **Environment**: `Node`
- **Region**: `Ohio (US East)` (o la más cercana)
- **Branch**: `deploy-setup`

**Comandos de build y start:**
- **Build Command**: `chmod +x render-build.sh && ./render-build.sh`
- **Start Command**: `chmod +x render-start.sh && ./render-start.sh`

**Plan:**
- **Instance Type**: `Free` (perfecto para proyectos académicos)

### 🔸 **Paso 5: Configurar variables de entorno**
En la configuración de tu servicio, ve a "Environment" y agrega:

| Variable | Valor |
|----------|--------|
| `JWT_SECRET` | `mi_super_secreto_jwt_key_academico_2024` |
| `NODE_ENV` | `production` |
| `MONGO_URI` | *(obtienes esto en el siguiente paso)* |

### 🔸 **Paso 6: Configurar MongoDB Atlas (GRATIS)**

#### Crear cluster gratuito:
1. Ve a [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Crea cuenta gratuita con Google/GitHub
3. Clic en "Build a Database" → "M0 FREE" (512MB gratis)
4. Selecciona región (AWS, us-east-1)
5. Nombre del cluster: `proyecto-backend`

#### Configurar acceso:
1. **Database Access**: 
   - Clic en "Add New Database User"
   - Username: `app_user`
   - Password: `app_password_123` (guárdalo)
   - Database User Privileges: "Read and write to any database"

2. **Network Access**:
   - Clic en "Add IP Address"
   - Selecciona "Allow Access from Anywhere" (0.0.0.0/0)
   - (Para producción real usarías IPs específicas)

#### Obtener connection string:
1. Ve a "Database" → "Connect"
2. Selecciona "Connect your application"
3. Driver: "Node.js", Version: "4.1 or later"
4. Copia la connection string:
   ```
   mongodb+srv://app_user:<password>@proyecto-backend.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Reemplaza `<password>` con `app_password_123`
6. Agrega el nombre de la base de datos al final:
   ```
   mongodb+srv://app_user:app_password_123@proyecto-backend.xxxxx.mongodb.net/proyecto_backend?retryWrites=true&w=majority
   ```

### 🔸 **Paso 7: Finalizar despliegue**
1. Vuelve a Render y agrega la `MONGO_URI` completa
2. Clic en "Create Web Service"
3. ¡Render automáticamente comenzará el build y despliegue!

---

## 🎉 ¡LISTO! Tu API estará en:
`https://tu-proyecto-backend.onrender.com`

### 🔍 **Verificar que funciona:**
Visita: `https://tu-proyecto-backend.onrender.com/api/health`

Deberías ver:
```json
{
  "success": true,
  "message": "API funcionando correctamente",
  "timestamp": "2024-09-30T...",
  "environment": "production"
}
```

---

## 📱 **Endpoints de tu API:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/health` | Verificar estado de la API |
| `POST` | `/api/auth/register` | Registro de usuarios |
| `POST` | `/api/auth/login` | Login de usuarios |
| `GET` | `/api/users` | Listar usuarios (requiere auth) |
| `GET` | `/api/projects` | Listar proyectos |
| `POST` | `/api/projects` | Crear proyecto |
| `GET` | `/api/tasks` | Listar tareas |
| `POST` | `/api/tasks` | Crear tarea |

---

## 🔧 **Comandos útiles:**

### Desarrollo local:
```bash
bun dev                    # Servidor de desarrollo
bun test                   # Ejecutar tests
bun run verify-deploy      # Verificar configuración
```

### Logs y debug:
- **Render Logs**: Ve a tu dashboard → tu servicio → "Logs"
- **MongoDB Logs**: Atlas dashboard → "Database" → "Browse Collections"

---

## 🆘 **Troubleshooting:**

### ❌ **Error de conexión a MongoDB:**
- Verifica que la IP 0.0.0.0/0 esté en la whitelist
- Revisa que el usuario de BD tenga permisos correctos
- Confirma que la MONGO_URI esté bien formada

### ❌ **Error 502 Bad Gateway:**
- Normal en el primer despliegue, espera 1-2 minutos
- Render necesita tiempo para instalar Bun la primera vez

### ❌ **Build failed:**
- Verifica que render-build.sh tenga permisos de ejecución
- Revisa los logs de build en Render dashboard

### ❌ **Variables de entorno:**
- Asegúrate de que todas estén configuradas en Render
- Las variables se aplican después de hacer redeploy

---

## 🌟 **Ventajas de tu setup actual:**

✅ **Runtime moderno**: Bun (más rápido que Node.js)
✅ **TypeScript**: Desarrollo type-safe
✅ **Express.js**: Framework probado y estable
✅ **MongoDB**: Base de datos NoSQL flexible
✅ **JWT Auth**: Autenticación segura
✅ **Rate limiting**: Protección contra abuse
✅ **Helmet**: Seguridad adicional
✅ **CORS**: Configurado para frontend
✅ **Error handling**: Middleware personalizado
✅ **Tests**: Jest configurado
✅ **Docker**: Containerización lista

---

## 💡 **Tips para proyectos académicos:**

1. **Documentación**: Menciona que usas tecnologías modernas (Bun, TypeScript)
2. **Demostración**: La URL pública es perfecta para mostrar a profesores
3. **Logs**: Render guarda logs que puedes mostrar como evidencia
4. **Escalabilidad**: Tu arquitectura puede manejar tráfico real
5. **Profesional**: SSL, dominio público, monitoreo incluido

---

**¡Tu backend está listo para impresionar! 🚀**

*Cualquier duda, revisa los logs en Render o verifica las variables de entorno.*