## Pruebas Manuales - Middleware de Autorización por Campos

### Preparación de Datos

1. **Crear usuarios de prueba:**
```sql
-- Admin
INSERT INTO users (id, email, name, lastName, role, passwordHash) 
VALUES ('admin-001', 'admin@test.com', 'Admin', 'User', 'ADMIN', '$hash');

-- Capataz con campos gestionados
INSERT INTO users (id, email, name, lastName, role, passwordHash) 
VALUES ('capataz-001', 'capataz@test.com', 'Juan', 'Capataz', 'CAPATAZ', '$hash');

-- Operario
INSERT INTO users (id, email, name, lastName, role, passwordHash) 
VALUES ('operario-001', 'operario@test.com', 'Pedro', 'Operario', 'OPERARIO', '$hash');
```

2. **Crear campos y asignar manager:**
```sql
-- Campo A (gestionado por capataz-001)
INSERT INTO fields (id, name, area, managerId) 
VALUES ('field-A', 'Campo Norte', 100, 'capataz-001');

-- Campo B (sin manager o con otro manager)
INSERT INTO fields (id, name, area, managerId) 
VALUES ('field-B', 'Campo Sur', 150, NULL);
```

3. **Crear parcelas:**
```sql
-- Parcela en Campo A
INSERT INTO plots (id, name, area, fieldId, varietyId) 
VALUES ('plot-A1', 'Parcela A1', 50, 'field-A', 'variety-001');

-- Parcela en Campo B
INSERT INTO plots (id, name, area, fieldId, varietyId) 
VALUES ('plot-B1', 'Parcela B1', 75, 'field-B', 'variety-001');
```

4. **Crear órdenes de trabajo:**
```sql
-- OT asignada al capataz
INSERT INTO work_orders (id, title, description, scheduledDate, dueDate, status, assignedToId) 
VALUES ('wo-001', 'Riego Campo A', 'Descripción', '2025-11-01', '2025-11-03', 'PENDING', 'capataz-001');

-- OT asignada al operario
INSERT INTO work_orders (id, title, description, scheduledDate, dueDate, status, assignedToId) 
VALUES ('wo-002', 'Cosecha Campo B', 'Descripción', '2025-11-01', '2025-11-03', 'PENDING', 'operario-001');

-- OT en parcela del Campo A (no asignada)
INSERT INTO work_orders (id, title, description, scheduledDate, dueDate, status) 
VALUES ('wo-003', 'Fumigación A', 'Descripción', '2025-11-01', '2025-11-03', 'PENDING');

-- Vincular OT con parcelas
INSERT INTO work_order_plots (workOrderId, plotId) VALUES ('wo-003', 'plot-A1');
```

---

### Casos de Prueba

#### 1. **ADMIN - Acceso Total**

```http
### Login como Admin
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "admin123"
}

### Ver todas las OTs (sin filtros)
GET http://localhost:3000/api/work-orders
Authorization: Bearer {{adminToken}}

### Resultado esperado:
# ✅ Ve wo-001, wo-002, wo-003 (todas las OTs)
```

#### 2. **CAPATAZ - Ver OTs de campos gestionados**

```http
### Login como Capataz
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "capataz@test.com",
  "password": "capataz123"
}

### Ver todas las OTs
GET http://localhost:3000/api/work-orders
Authorization: Bearer {{capatazToken}}

### Resultado esperado:
# ✅ Ve wo-001 (asignada a él)
# ✅ Ve wo-003 (parcela en su campo gestionado field-A)
# ❌ NO ve wo-002 (asignada a otro usuario y no está en sus campos)

### Ver OTs por plotId de su campo
GET http://localhost:3000/api/work-orders?plotId=plot-A1
Authorization: Bearer {{capatazToken}}

### Resultado esperado:
# ✅ Ve wo-003 (parcela en su campo)

### Intentar ver OTs de parcela fuera de sus campos
GET http://localhost:3000/api/work-orders?plotId=plot-B1
Authorization: Bearer {{capatazToken}}

### Resultado esperado:
# ❌ 403 FORBIDDEN - No tiene acceso a esta parcela
```

#### 3. **CAPATAZ - Ver parcelas de campos gestionados**

```http
### Ver todas las parcelas
GET http://localhost:3000/api/plots
Authorization: Bearer {{capatazToken}}

### Resultado esperado:
# ✅ Ve plot-A1 (del campo field-A que gestiona)
# ❌ NO ve plot-B1 (del campo field-B que no gestiona)

### Intentar acceder a parcela específica de su campo
GET http://localhost:3000/api/plots/plot-A1
Authorization: Bearer {{capatazToken}}

### Resultado esperado:
# ✅ 200 OK - Puede ver la parcela

### Intentar acceder a parcela fuera de sus campos
GET http://localhost:3000/api/plots/plot-B1
Authorization: Bearer {{capatazToken}}

### Resultado esperado:
# ❌ 403 FORBIDDEN - No tiene permisos para acceder a esta parcela
```

#### 4. **OPERARIO - Solo OTs asignadas**

```http
### Login como Operario
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "operario@test.com",
  "password": "operario123"
}

### Ver todas las OTs
GET http://localhost:3000/api/work-orders
Authorization: Bearer {{operarioToken}}

### Resultado esperado:
# ✅ Ve wo-002 (asignada a él)
# ❌ NO ve wo-001 (asignada a otro usuario)
# ❌ NO ve wo-003 (no asignada o asignada a otro usuario)

### Intentar filtrar por otro usuario
GET http://localhost:3000/api/work-orders?assignedToId=capataz-001
Authorization: Bearer {{operarioToken}}

### Resultado esperado:
# ❌ 403 FORBIDDEN - Un operario solo puede ver sus propias órdenes

### Intentar ver una OT específica de otro usuario
GET http://localhost:3000/api/work-orders/wo-001
Authorization: Bearer {{operarioToken}}

### Resultado esperado:
# ❌ 403 FORBIDDEN - No tiene permisos para acceder a esta orden
```

#### 5. **CAPATAZ sin campos gestionados**

```http
### Crear capataz sin campos
INSERT INTO users (id, email, name, lastName, role, passwordHash) 
VALUES ('capataz-002', 'capataz2@test.com', 'Maria', 'Capataz', 'CAPATAZ', '$hash');

### Crear OT asignada a este capataz
INSERT INTO work_orders (id, title, description, scheduledDate, dueDate, status, assignedToId) 
VALUES ('wo-004', 'Tarea Capataz 2', 'Descripción', '2025-11-01', '2025-11-03', 'PENDING', 'capataz-002');

### Login como Capataz 2
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "capataz2@test.com",
  "password": "capataz123"
}

### Ver todas las OTs
GET http://localhost:3000/api/work-orders
Authorization: Bearer {{capataz2Token}}

### Resultado esperado:
# ✅ Ve wo-004 (asignada a él)
# ❌ NO ve otras OTs
# Comportamiento: igual a OPERARIO (solo ve sus OTs asignadas)
```

---

### Matriz de Validación

| Usuario | Endpoint | Parámetros | Resultado Esperado |
|---------|----------|------------|-------------------|
| ADMIN | GET /work-orders | - | ✅ Todas las OTs |
| ADMIN | GET /plots | - | ✅ Todas las parcelas |
| CAPATAZ (con fields) | GET /work-orders | - | ✅ OTs asignadas + OTs de sus campos |
| CAPATAZ (con fields) | GET /work-orders | plotId=plot-A1 | ✅ OTs de parcela en su campo |
| CAPATAZ (con fields) | GET /work-orders | plotId=plot-B1 | ❌ 403 FORBIDDEN |
| CAPATAZ (con fields) | GET /plots | - | ✅ Solo parcelas de sus campos |
| CAPATAZ (con fields) | GET /plots/:id | plot-A1 | ✅ 200 OK |
| CAPATAZ (con fields) | GET /plots/:id | plot-B1 | ❌ 403 FORBIDDEN |
| CAPATAZ (sin fields) | GET /work-orders | - | ✅ Solo OTs asignadas a él |
| OPERARIO | GET /work-orders | - | ✅ Solo OTs asignadas a él |
| OPERARIO | GET /work-orders | assignedToId=otro | ❌ 403 FORBIDDEN |
| OPERARIO | GET /work-orders/:id | wo-001 (otro user) | ❌ 403 FORBIDDEN |

---

### Notas para Testing

1. **Tokens JWT**: Cada usuario debe obtener su token mediante el endpoint `/api/auth/login`

2. **managedFields**: El middleware carga automáticamente los campos gestionados del usuario desde la base de datos

3. **Query forzado**: Para OPERARIO, el middleware fuerza automáticamente `assignedToId = userId` en todas las peticiones

4. **Validación temprana**: El middleware valida acceso antes de llegar al controlador, retornando 403 inmediatamente si no tiene permisos

5. **Logs útiles**: Considera agregar logs en el middleware para debugging:
```typescript
console.log(`[AuthFieldAccess] User: ${userId}, Role: ${role}, ManagedFields: ${managedFieldIds.length}`);
```

---

### Troubleshooting

**Problema**: CAPATAZ no ve OTs de sus campos
- Verificar que `field.managerId` esté correctamente asignado en la BD
- Verificar que las parcelas tengan `fieldId` correcto
- Verificar que la OT tenga parcelas asociadas en `work_order_plots`

**Problema**: OPERARIO ve OTs de otros usuarios
- Verificar que el middleware `authorizeFieldAccess` esté registrado en las rutas
- Verificar orden de middlewares: `authenticate` → `authorizeFieldAccess` → `controller`

**Problema**: 401 Unauthorized
- Verificar que el token JWT sea válido y no haya expirado
- Verificar que el header `Authorization: Bearer <token>` esté correctamente formateado
