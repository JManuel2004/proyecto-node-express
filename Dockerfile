# Usar la imagen oficial de Bun
FROM oven/bun:1 as base

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json bun.lockb* ./

# Instalar dependencias
RUN bun install --frozen-lockfile --production

# Copiar el código fuente
COPY . .

# Exponer el puerto
EXPOSE 3000

# Configurar usuario no root por seguridad
USER bun

# Comando para iniciar la aplicación
CMD ["bun", "start"]