#!/bin/bash
# Script de comandos útiles para el desarrollo del sistema de autenticación

echo "🔧 Comandos Útiles - Sistema de Autenticación JWT"
echo "=================================================="
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_command() {
    echo -e "${BLUE}$1${NC}"
    echo -e "${YELLOW}$2${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${GREEN}=== $1 ===${NC}"
    echo ""
}

# DESARROLLO
print_section "DESARROLLO"

print_command "Iniciar servidor en modo desarrollo:" \
"npm run dev"

print_command "Compilar TypeScript:" \
"npm run build"

print_command "Iniciar servidor de producción:" \
"npm start"

# BASE DE DATOS
print_section "BASE DE DATOS"

print_command "Crear usuario administrador inicial:" \
"npm run seed:admin"

print_command "Conectar a PostgreSQL:" \
"psql -h localhost -U postgres -d tejada_hnos"

print_command "Ver refresh tokens en la BD:" \
"psql -h localhost -U postgres -d tejada_hnos -c 'SELECT * FROM refresh_tokens;'"

print_command "Ver usuarios en la BD:" \
"psql -h localhost -U postgres -d tejada_hnos -c 'SELECT id, email, name, role FROM users;'"

print_command "Limpiar refresh tokens revocados:" \
"psql -h localhost -U postgres -d tejada_hnos -c 'DELETE FROM refresh_tokens WHERE revoked = true;'"

print_command "Limpiar refresh tokens expirados:" \
"psql -h localhost -U postgres -d tejada_hnos -c \"DELETE FROM refresh_tokens WHERE expires_at < NOW();\""

# TESTING
print_section "TESTING CON cURL"

print_command "Registrar usuario ADMIN:" \
"curl -X POST http://localhost:3000/auth/register \\
  -H 'Content-Type: application/json' \\
  -d '{
    \"email\": \"admin@test.com\",
    \"password\": \"admin123\",
    \"name\": \"Admin\",
    \"lastName\": \"Test\",
    \"role\": \"ADMIN\"
  }'"

print_command "Login:" \
"curl -X POST http://localhost:3000/auth/login \\
  -H 'Content-Type: application/json' \\
  -d '{
    \"email\": \"admin@test.com\",
    \"password\": \"admin123\"
  }'"

print_command "Obtener usuario autenticado:" \
"TOKEN=\"tu_access_token_aqui\"
curl -X GET http://localhost:3000/auth/me \\
  -H \"Authorization: Bearer \$TOKEN\""

print_command "Refrescar token:" \
"REFRESH_TOKEN=\"tu_refresh_token_aqui\"
curl -X POST http://localhost:3000/auth/refresh \\
  -H 'Content-Type: application/json' \\
  -d \"{
    \\\"refreshToken\\\": \\\"\$REFRESH_TOKEN\\\"
  }\""

print_command "Logout:" \
"REFRESH_TOKEN=\"tu_refresh_token_aqui\"
curl -X POST http://localhost:3000/auth/logout \\
  -H 'Content-Type: application/json' \\
  -d \"{
    \\\"refreshToken\\\": \\\"\$REFRESH_TOKEN\\\"
  }\""

# UTILIDADES
print_section "UTILIDADES"

print_command "Generar secreto JWT seguro (Linux/Mac):" \
"openssl rand -base64 64"

print_command "Generar secreto JWT seguro (Node):" \
"node -e \"console.log(require('crypto').randomBytes(64).toString('base64'))\""

print_command "Ver logs del servidor (si usas PM2):" \
"pm2 logs"

print_command "Verificar puerto 3000 en uso:" \
"lsof -i :3000"

print_command "Matar proceso en puerto 3000:" \
"kill -9 \$(lsof -t -i:3000)"

# DOCKER (si se usa)
print_section "DOCKER (Opcional)"

print_command "Iniciar PostgreSQL con Docker:" \
"docker run --name postgres-tejada \\
  -e POSTGRES_PASSWORD=yourpassword \\
  -e POSTGRES_DB=tejada_hnos \\
  -p 5432:5432 \\
  -d postgres:15"

print_command "Ver logs de PostgreSQL:" \
"docker logs postgres-tejada"

print_command "Detener PostgreSQL:" \
"docker stop postgres-tejada"

print_command "Iniciar PostgreSQL existente:" \
"docker start postgres-tejada"

# GIT
print_section "GIT"

print_command "Ver estado:" \
"git status"

print_command "Agregar cambios de autenticación:" \
"git add src/controllers/auth.controller.ts \\
       src/services/auth.service.ts \\
       src/middlewares/auth.middleware.ts \\
       src/middlewares/authorize.middleware.ts \\
       src/routes/auth.routes.ts \\
       docs/"

print_command "Commit de implementación de autenticación:" \
"git commit -m \"feat: implement JWT authentication system with refresh tokens\""

# DEBUGGING
print_section "DEBUGGING"

print_command "Ver valor decodificado de un JWT (Node):" \
"TOKEN=\"tu_token_aqui\"
node -e \"console.log(JSON.stringify(require('jsonwebtoken').decode('\$TOKEN'), null, 2))\""

print_command "Verificar variables de entorno:" \
"cat .env"

print_command "Ver errores de TypeScript:" \
"npx tsc --noEmit"

print_command "Verificar dependencias instaladas:" \
"npm list jsonwebtoken bcrypt"

# PRODUCCIÓN
print_section "PRODUCCIÓN"

print_command "Build para producción:" \
"npm run build"

print_command "Configurar PM2 para producción:" \
"pm2 start dist/index.js --name tejada-backend"

print_command "Guardar configuración PM2:" \
"pm2 save"

print_command "Configurar inicio automático PM2:" \
"pm2 startup"

# LIMPIEZA
print_section "LIMPIEZA"

print_command "Limpiar node_modules:" \
"rm -rf node_modules"

print_command "Limpiar build:" \
"rm -rf dist"

print_command "Reinstalar dependencias:" \
"npm install"

print_command "Limpiar cache de npm:" \
"npm cache clean --force"

echo ""
echo -e "${GREEN}¡Para más información, consulta la documentación en docs/${NC}"
echo ""
