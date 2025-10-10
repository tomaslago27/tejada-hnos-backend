# Sistema de Autenticación JWT

Este documento describe el sistema de autenticación y autorización implementado en el backend de Tejada Hnos.

## Características

- ✅ Autenticación mediante JWT (JSON Web Tokens)
- ✅ Access tokens con expiración de 3 horas
- ✅ Refresh tokens para renovar el acceso (7 días de validez)
- ✅ Middleware de autenticación para proteger endpoints
- ✅ Middleware de autorización por roles (ADMIN, OPERARIO)
- ✅ Encriptación de contraseñas con bcrypt
- ✅ Revocación de tokens al cerrar sesión

## Endpoints de Autenticación

### 1. Registro de Usuario

**POST** `/auth/register`

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "Juan",
  "lastName": "Pérez",
  "role": "OPERARIO" // Opcional, por defecto es OPERARIO
}
```

**Respuesta:**
```json
{
  "message": "Usuario registrado exitosamente",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Juan",
      "lastName": "Pérez",
      "role": "OPERARIO"
    }
  }
}
```

### 2. Inicio de Sesión

**POST** `/auth/login`

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Respuesta:**
```json
{
  "message": "Inicio de sesión exitoso",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Juan",
      "lastName": "Pérez",
      "role": "OPERARIO"
    }
  }
}
```

### 3. Refrescar Token

**POST** `/auth/refresh`

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Respuesta:**
```json
{
  "message": "Token refrescado exitosamente",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 4. Cerrar Sesión

**POST** `/auth/logout`

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Respuesta:**
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

### 5. Obtener Usuario Autenticado

**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Respuesta:**
```json
{
  "message": "Usuario autenticado",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "role": "OPERARIO"
  }
}
```

## Uso de Middlewares

### Middleware de Autenticación

Protege rutas para que solo usuarios autenticados puedan acceder:

```typescript
import { authenticate } from "@middlewares/auth.middleware";

// Proteger una ruta
router.get("/protected", authenticate, controller.method);
```

### Middleware de Autorización por Rol

Restringe el acceso a usuarios con roles específicos:

```typescript
import { authenticate } from "@middlewares/auth.middleware";
import { authorize } from "@middlewares/authorize.middleware";
import { UserRole } from "@/enums";

// Solo admins pueden crear usuarios
router.post(
  "/users", 
  authenticate, 
  authorize(UserRole.ADMIN), 
  controller.createUser
);

// Admins y operarios pueden ver usuarios
router.get(
  "/users", 
  authenticate, 
  authorize(UserRole.ADMIN, UserRole.OPERARIO), 
  controller.getUsers
);
```

## Ejemplo de Uso en el Cliente

### 1. Login y almacenar tokens

```javascript
const response = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const data = await response.json();

// Guardar tokens (localStorage, sessionStorage, o cookies seguras)
localStorage.setItem('accessToken', data.data.accessToken);
localStorage.setItem('refreshToken', data.data.refreshToken);
```

### 2. Hacer peticiones autenticadas

```javascript
const accessToken = localStorage.getItem('accessToken');

const response = await fetch('http://localhost:3000/users', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

### 3. Refrescar token cuando expira

```javascript
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('http://localhost:3000/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  const data = await response.json();
  
  // Actualizar tokens
  localStorage.setItem('accessToken', data.data.accessToken);
  localStorage.setItem('refreshToken', data.data.refreshToken);
}

// Implementar interceptor para refrescar automáticamente
async function fetchWithAuth(url, options = {}) {
  let accessToken = localStorage.getItem('accessToken');
  
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  // Si el token expiró, refrescar y reintentar
  if (response.status === 401) {
    await refreshAccessToken();
    accessToken = localStorage.getItem('accessToken');
    
    response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`
      }
    });
  }
  
  return response;
}
```

### 4. Cerrar sesión

```javascript
const refreshToken = localStorage.getItem('refreshToken');

await fetch('http://localhost:3000/auth/logout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken })
});

// Limpiar tokens
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
```

## Roles de Usuario

El sistema soporta dos roles:

- **ADMIN**: Acceso completo al sistema
- **OPERARIO**: Acceso limitado a operaciones básicas

Los roles se definen en `/src/enums/index.ts`:

```typescript
export enum UserRole {
  ADMIN = 'ADMIN',
  OPERARIO = 'OPERARIO',
}
```

## Seguridad

### Recomendaciones de Producción

1. **Variables de Entorno**: Cambiar los valores de `JWT_SECRET` y `JWT_REFRESH_SECRET` a claves seguras y aleatorias.

2. **HTTPS**: Usar siempre HTTPS en producción para proteger los tokens en tránsito.

3. **httpOnly Cookies**: Considerar usar cookies httpOnly para almacenar el refresh token en lugar de localStorage.

4. **Rate Limiting**: Implementar rate limiting en los endpoints de autenticación para prevenir ataques de fuerza bruta.

5. **Validación de Entrada**: Validar todas las entradas del usuario (email, contraseña, etc.).

6. **Sincronización de Base de Datos**: Cambiar `synchronize: false` en la configuración de TypeORM en producción.

## Flujo de Autenticación

```
1. Usuario → POST /auth/login
2. Backend → Valida credenciales
3. Backend → Genera access token (3h) y refresh token (7d)
4. Backend → Guarda refresh token en BD
5. Cliente → Recibe y almacena tokens
6. Cliente → Usa access token en cada petición
7. Access token expira (3h)
8. Cliente → POST /auth/refresh con refresh token
9. Backend → Valida refresh token
10. Backend → Genera nuevos tokens
11. Backend → Revoca refresh token anterior
12. Cliente → Recibe nuevos tokens
```

## Base de Datos

### Tabla: refresh_tokens

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY,
  token VARCHAR NOT NULL,
  userId UUID NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  revoked BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### Tabla: users

La contraseña se almacena hasheada usando bcrypt con 10 rounds de salt.

## Errores Comunes

### 401 Unauthorized
- Token no proporcionado
- Token inválido o expirado
- Usuario no autenticado

### 403 Forbidden
- Usuario autenticado pero sin permisos suficientes
- Rol de usuario no autorizado para el recurso

### 400 Bad Request
- Datos de entrada inválidos
- Usuario ya existe (registro)
- Credenciales incorrectas (login)

## Testing

Puedes probar los endpoints usando herramientas como Postman, Insomnia o cURL:

```bash
# Registro
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'

# Petición autenticada
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
