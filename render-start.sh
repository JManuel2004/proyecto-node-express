#!/bin/bash
# Script de inicio para Render.com

echo "🚀 Iniciando aplicación con Bun..."

# Asegurar que Bun esté en el PATH
export PATH=$PATH:$HOME/.bun/bin

# Verificar variables de entorno críticas
if [ -z "$JWT_SECRET" ]; then
    echo "⚠️  Advertencia: JWT_SECRET no está configurado"
fi

if [ -z "$MONGO_URI" ]; then
    echo "⚠️  Advertencia: MONGO_URI no está configurado"
fi

echo "📊 Configuración del entorno:"
echo "   NODE_ENV: ${NODE_ENV:-development}"
echo "   PORT: ${PORT:-3000}"

# Iniciar la aplicación
exec bun start