# Checklist de Testing - Sistema de Autenticación

## ✅ Tests Manuales

### 1. Registro de Usuario

- [ ] Registrar un nuevo usuario ADMIN
  ```bash
  POST /auth/register
  {
    "email": "admin@test.com",
    "password": "admin123",
    "name": "Admin",
    "lastName": "Test",
    "role": "ADMIN"
  }
  ```
  - [ ] Respuesta 201 con tokens y datos de usuario
  - [ ] Usuario guardado en base de datos
  - [ ] Contraseña hasheada correctamente

- [ ] Registrar un nuevo usuario OPERARIO
  - [ ] Funciona sin especificar rol (por defecto OPERARIO)
  - [ ] Funciona especificando rol OPERARIO

- [ ] Validaciones de registro
  - [ ] Error al intentar registrar email duplicado
  - [ ] Error con campos faltantes (email, password, name, lastName)
  - [ ] Error con email inválido

### 2. Login

- [ ] Login exitoso con credenciales correctas
  ```bash
  POST /auth/login
  {
    "email": "admin@test.com",
    "password": "admin123"
  }
  ```
  - [ ] Respuesta 200 con tokens y datos de usuario
  - [ ] Access token válido
  - [ ] Refresh token guardado en BD

- [ ] Login fallido
  - [ ] Error 401 con email inexistente
  - [ ] Error 401 con contraseña incorrecta
  - [ ] Error 400 con campos faltantes

### 3. Autenticación (Middleware)

- [ ] Acceso a ruta protegida con token válido
  ```bash
  GET /auth/me
  Authorization: Bearer <access_token>
  ```
  - [ ] Respuesta 200 con datos del usuario
  - [ ] Request.user contiene información correcta

- [ ] Acceso denegado sin token
  - [ ] Error 401 sin header Authorization
  - [ ] Error 401 con header malformado

- [ ] Acceso denegado con token inválido
  - [ ] Error 401 con token expirado
  - [ ] Error 401 con token manipulado
  - [ ] Error 401 con token de formato incorrecto

### 4. Autorización por Roles

- [ ] ADMIN puede acceder a rutas de ADMIN
  ```bash
  POST /users
  Authorization: Bearer <admin_token>
  ```
  - [ ] Respuesta exitosa

- [ ] OPERARIO no puede acceder a rutas de ADMIN
  - [ ] Error 403 Forbidden
  - [ ] Mensaje indicando falta de permisos

- [ ] Ambos roles pueden acceder a rutas comunes
  - [ ] ADMIN puede acceder
  - [ ] OPERARIO puede acceder

### 5. Refresh Token

- [ ] Refrescar token con refresh token válido
  ```bash
  POST /auth/refresh
  {
    "refreshToken": "<refresh_token>"
  }
  ```
  - [ ] Respuesta 200 con nuevos tokens
  - [ ] Access token anterior ya no válido
  - [ ] Refresh token anterior revocado en BD
  - [ ] Nuevo refresh token guardado en BD

- [ ] Refrescar token fallido
  - [ ] Error 401 con refresh token inválido
  - [ ] Error 401 con refresh token expirado
  - [ ] Error 401 con refresh token revocado
  - [ ] Error 400 sin refresh token en body

### 6. Logout

- [ ] Logout exitoso
  ```bash
  POST /auth/logout
  {
    "refreshToken": "<refresh_token>"
  }
  ```
  - [ ] Respuesta 200
  - [ ] Refresh token marcado como revocado en BD
  - [ ] No se puede usar el refresh token después del logout

- [ ] Logout sin refresh token
  - [ ] Respuesta 200 (logout "suave")

### 7. Expiración de Tokens

- [ ] Access token expira después de 3 horas
  - [ ] Esperar o modificar tiempo de expiración para testing
  - [ ] Token expirado genera error 401
  - [ ] Mensaje indica que el token expiró

- [ ] Refresh token expira después de 7 días
  - [ ] Token expirado no puede usarse para refresh
  - [ ] Error apropiado al intentar usar token expirado

### 8. Seguridad

- [ ] Contraseñas hasheadas en base de datos
  - [ ] Verificar que no se guardan en texto plano
  - [ ] Hash diferente para misma contraseña (salt aleatorio)

- [ ] Información sensible no expuesta
  - [ ] passwordHash no se devuelve en respuestas
  - [ ] Mensajes de error no revelan información sensible

- [ ] Tokens únicos
  - [ ] Cada login genera tokens diferentes
  - [ ] Tokens no son predecibles

### 9. Base de Datos

- [ ] Tabla refresh_tokens
  - [ ] Se crean registros al generar refresh tokens
  - [ ] Campo revoked se actualiza al logout
  - [ ] Campo expiresAt se establece correctamente
  - [ ] Foreign key a users funciona (CASCADE on delete)

- [ ] Tabla users
  - [ ] Email es único
  - [ ] Role tiene valor por defecto (OPERARIO)
  - [ ] Timestamps se registran correctamente

### 10. Script Seed

- [ ] Ejecutar script de seed
  ```bash
  npm run seed:admin
  ```
  - [ ] Crea usuario admin correctamente
  - [ ] Email: admin@tejadahnos.com
  - [ ] Password: admin123
  - [ ] Role: ADMIN
  - [ ] No crea duplicados si ya existe

### 11. Error Handling

- [ ] Errores devuelven formato consistente
  - [ ] Status code apropiado
  - [ ] Mensaje descriptivo
  - [ ] No expone stack traces en producción

- [ ] Error handler centralizado funciona
  - [ ] Captura errores no manejados
  - [ ] Log de errores funciona

### 12. Integración

- [ ] Múltiples usuarios simultáneos
  - [ ] Varios usuarios pueden estar autenticados
  - [ ] Tokens no se mezclan
  - [ ] Cada sesión es independiente

- [ ] Refresh token workflow completo
  1. [ ] Login inicial
  2. [ ] Usar access token
  3. [ ] Esperar expiración
  4. [ ] Refrescar con refresh token
  5. [ ] Usar nuevo access token
  6. [ ] Logout final

## 🧪 Tests Automatizados (Recomendados)

### Frameworks Sugeridos
- Jest
- Supertest
- @types/jest
- @types/supertest

### Áreas a Cubrir

```typescript
describe('Authentication', () => {
  describe('POST /auth/register', () => {
    it('should register a new user');
    it('should hash the password');
    it('should return tokens');
    it('should fail with duplicate email');
    it('should fail with missing fields');
  });

  describe('POST /auth/login', () => {
    it('should login with correct credentials');
    it('should fail with incorrect password');
    it('should fail with non-existent email');
  });

  describe('POST /auth/refresh', () => {
    it('should refresh access token');
    it('should revoke old refresh token');
    it('should fail with invalid refresh token');
  });

  describe('POST /auth/logout', () => {
    it('should revoke refresh token');
    it('should handle missing refresh token');
  });

  describe('GET /auth/me', () => {
    it('should return user info with valid token');
    it('should fail without token');
    it('should fail with invalid token');
  });
});

describe('Authorization', () => {
  describe('Role-based access', () => {
    it('should allow ADMIN to access admin routes');
    it('should deny OPERARIO from admin routes');
    it('should allow both roles to common routes');
  });
});
```

## 📊 Métricas de Éxito

- [ ] Todas las pruebas manuales pasan
- [ ] No hay errores de compilación
- [ ] No hay errores en tiempo de ejecución
- [ ] Respuestas de API son consistentes
- [ ] Tiempos de respuesta < 500ms
- [ ] Base de datos se actualiza correctamente
- [ ] No hay memory leaks
- [ ] Logs son claros y útiles

## 🔍 Testing con Herramientas

### Postman/Insomnia
- [ ] Importar colección de requests
- [ ] Configurar variables de entorno
- [ ] Ejecutar suite completa
- [ ] Verificar respuestas

### cURL
- [ ] Todos los ejemplos del README funcionan
- [ ] Scripts de bash para testing automatizado

### REST Client (VS Code)
- [ ] Archivo api-requests.http funciona
- [ ] Variables se pueden configurar
- [ ] Todas las peticiones exitosas

## 🐛 Casos Edge

- [ ] Token con caracteres especiales
- [ ] Múltiples refresh simultáneos
- [ ] Logout sin estar logueado
- [ ] Registro con espacios en campos
- [ ] Email con mayúsculas/minúsculas
- [ ] Contraseñas muy largas/muy cortas
- [ ] Caracteres especiales en contraseña
- [ ] Payload JWT modificado
- [ ] Refresh token usado múltiples veces

## ✨ Tests de Rendimiento

- [ ] 100 usuarios concurrentes login
- [ ] 1000 requests con autenticación
- [ ] Múltiples refresh simultáneos
- [ ] Base de datos con 10k+ refresh tokens

## 📝 Documentación

- [ ] README actualizado
- [ ] Ejemplos funcionan
- [ ] Variables de entorno documentadas
- [ ] Errores documentados
- [ ] Guía de integración clara

---

## 🎯 Resultado Final

Total de pruebas: ___ / ___
Fecha de testing: ___________
Tester: ___________
Estado: [ ] Aprobado [ ] Requiere correcciones

### Notas:
```
(Agregar observaciones, bugs encontrados, sugerencias)
```
