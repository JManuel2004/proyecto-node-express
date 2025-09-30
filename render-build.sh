#!/bin/bash
# Render.com Build Script - Optimizado para Bun
echo "🚀 Instalando Bun runtime..."

# Instalar Bun si no está disponible
if ! command -v bun &> /dev/null; then
    curl -fsSL https://bun.sh/install | bash
    export PATH=$PATH:$HOME/.bun/bin
fi

echo "📦 Instalando dependencias del proyecto..."
bun install --frozen-lockfile --production

echo "✅ Build completado para Render!"
echo "🌟 Proyecto listo para ejecutar con 'bun start'"