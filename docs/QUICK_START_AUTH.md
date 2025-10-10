# Guía Rápida - Sistema de Autenticación JWT

## 🚀 Inicio Rápido

### 1. Configurar Variables de Entorno

Copia `.env.example` a `.env` y configura tus valores:

```bash
cp .env.example .env
```

**Configuración de Tokens:**
- `JWT_EXPIRES_IN=15m` - Token de acceso (duración corta, por defecto 15 minutos)
- `JWT_REFRESH_EXPIRES_IN=12h` - Refresh token (máximo 12 horas)

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Iniciar el Servidor

```bash
npm run dev
```

## 📝 Ejemplos de Uso

### Registro de Usuario

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123",
    "name": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }'
```

**Respuesta:**
```json
{
  "message": "Usuario registrado exitosamente",
  "data": {
    "accessToken": "eyJhbGc...",  // 15 minutos
    "refreshToken": "eyJhbGc...", // 12 horas
    "user": { ... }
  }
}
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Guarda AMBOS tokens:
- `accessToken`: para peticiones (corta duración)
- `refreshToken`: para renovar el acceso (larga duración)

### Acceder a Ruta Protegida

```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer TU_ACCESS_TOKEN_AQUI"
```

### Refrescar Token (cuando el access token expire)

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "TU_REFRESH_TOKEN_AQUI"
  }'
```

**Respuesta:**
```json
{
  "message": "Token refrescado exitosamente",
  "data": {
    "accessToken": "nuevo_access_token",
    "refreshToken": "nuevo_refresh_token"
  }
}
```

⚠️ **IMPORTANTE:** Guarda ambos nuevos tokens. El refresh token también se renueva.

### Cerrar Sesión

```bash
curl -X POST http://localhost:3000/auth/logout
```

Después de cerrar sesión, **elimina ambos tokens del almacenamiento del cliente**.

## 🔐 Proteger tus Rutas

### Solo Autenticación (cualquier usuario logueado)

```typescript
import { authenticate } from "@middlewares/auth.middleware";

router.get("/ruta-protegida", authenticate, controller.metodo);
```

### Autenticación + Autorización por Rol

```typescript
import { authenticate } from "@middlewares/auth.middleware";
import { authorize } from "@middlewares/authorize.middleware";
import { UserRole } from "@/enums";

// Solo ADMIN puede acceder
router.post(
  "/admin-only", 
  authenticate, 
  authorize(UserRole.ADMIN), 
  controller.metodo
);

// ADMIN y OPERARIO pueden acceder
router.get(
  "/users", 
  authenticate, 
  authorize(UserRole.ADMIN, UserRole.OPERARIO), 
  controller.metodo
);
```

## 🔄 Flujo de Tokens

```
1. Login → Recibe accessToken (15m) + refreshToken (12h)
2. Guarda ambos tokens en el cliente
3. Usa accessToken para peticiones
4. Cuando accessToken expire (401):
   - Llama a /auth/refresh con refreshToken
   - Recibe NUEVOS accessToken + refreshToken
   - Actualiza ambos tokens
5. Cuando refreshToken expire (401):
   - Redirige al usuario al login
```

## 📚 Documentación Completa

Ver [AUTHENTICATION.md](./AUTHENTICATION.md) para documentación detallada.

## 🔑 Roles Disponibles

- `ADMIN`: Acceso completo
- `OPERARIO`: Acceso básico

## ⚙️ Duración de Tokens

- **Access Token**: 15 minutos (configurable, recomendado corto)
- **Refresh Token**: 12 horas máximo (configurable, pero no más de 12h)

## 🛡️ Seguridad

⚠️ **IMPORTANTE**: 
- Cambia `JWT_SECRET` y `JWT_REFRESH_SECRET` en producción
- Los tokens NO se almacenan en base de datos
- El cliente es responsable de guardar los tokens de forma segura
- Usa `localStorage` o cookies `httpOnly` según tu necesidad

```bash
# Generar secretos seguros (Linux/Mac)
openssl rand -base64 64
```

## 💡 Tips

1. **Access Token expirado (401):** Usa el refresh token para renovar
2. **Refresh Token expirado (401):** El usuario debe volver a hacer login
3. **Logout:** Elimina ambos tokens del almacenamiento del cliente
4. Los tokens se renuevan en cada refresh (rotación de tokens)
