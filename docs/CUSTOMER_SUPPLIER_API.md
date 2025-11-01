# API de Clientes y Proveedores

Documentación de los endpoints para gestionar Clientes (Customers) y Proveedores (Suppliers).

## 📋 Resumen

Se han implementado APIs completas para la gestión de Clientes y Proveedores con las siguientes características:

- **CRUD completo** (Create, Read, Update, Delete)
- **Soft delete** con capacidad de restauración
- **Hard delete** para eliminación permanente
- **Autorización por roles**:
  - **ADMIN**: Acceso completo (crear, modificar, eliminar, consultar)
  - **CAPATAZ**: Solo consultar (GET)
  - **OPERARIO**: Sin acceso

## 🔐 Autorización

### Clientes (Customers)

| Endpoint | Método | ADMIN | CAPATAZ | OPERARIO |
|----------|--------|-------|---------|----------|
| GET /customers | GET | ✅ | ✅ | ❌ |
| GET /customers/:id | GET | ✅ | ✅ | ❌ |
| POST /customers | POST | ✅ | ❌ | ❌ |
| PUT /customers/:id | PUT | ✅ | ❌ | ❌ |
| DELETE /customers/:id | DELETE | ✅ | ❌ | ❌ |
| PATCH /customers/:id/restore | PATCH | ✅ | ❌ | ❌ |
| DELETE /customers/:id/hard | DELETE | ✅ | ❌ | ❌ |

### Proveedores (Suppliers)

| Endpoint | Método | ADMIN | CAPATAZ | OPERARIO |
|----------|--------|-------|---------|----------|
| GET /suppliers | GET | ✅ | ✅ | ❌ |
| GET /suppliers/:id | GET | ✅ | ✅ | ❌ |
| POST /suppliers | POST | ✅ | ❌ | ❌ |
| PUT /suppliers/:id | PUT | ✅ | ❌ | ❌ |
| DELETE /suppliers/:id | DELETE | ✅ | ❌ | ❌ |
| PATCH /suppliers/:id/restore | PATCH | ✅ | ❌ | ❌ |
| DELETE /suppliers/:id/hard | DELETE | ✅ | ❌ | ❌ |

## 📡 Endpoints - Customers

### 1. Obtener todos los clientes con filtros

```http
GET /customers
Authorization: Bearer {token}
```

**Query Parameters:**
- `searchTerm` (optional): Buscar por nombre del cliente (case-insensitive)
- `minTotalPurchases` (optional): Filtrar clientes con total gastado mayor o igual a este valor
- `maxTotalPurchases` (optional): Filtrar clientes con total gastado menor o igual a este valor
- `withDeleted` (optional): `true` para incluir clientes eliminados (soft delete)

**Ejemplos de Uso:**
```bash
# Todos los clientes
GET /customers

# Clientes VIP (más de $100,000 gastados)
GET /customers?minTotalPurchases=100000

# Clientes en rango específico
GET /customers?minTotalPurchases=50000&maxTotalPurchases=150000

# Buscar por nombre y filtrar por total
GET /customers?searchTerm=super&minTotalPurchases=10000

# Incluir clientes eliminados
GET /customers?withDeleted=true
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Cliente SA",
      "taxId": "20-12345678-9",
      "address": "Av. Principal 123",
      "contactEmail": "contacto@cliente.com",
      "phoneNumber": "+54 11 1234-5678",
      "totalSpent": 150000.50,
      "totalOrders": 12,
      "salesOrders": [
        {
          "id": "order-uuid",
          "status": "COMPLETADA",
          "details": [
            {
              "id": "detail-uuid",
              "caliber": "Grande",
              "variety": "Thompson",
              "unitPrice": 500.00,
              "quantityKg": 100.00
            }
          ]
        }
      ],
      "createdAt": "2025-10-30T10:00:00.000Z",
      "updatedAt": "2025-10-30T10:00:00.000Z",
      "deletedAt": null
    }
  ]
}
```

**Nota:** El campo `totalSpent` se calcula automáticamente sumando `(unitPrice × quantityKg)` de todos los `SalesOrderDetails` de cada cliente.

### 2. Obtener un cliente por ID

```http
GET /customers/:id
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Cliente SA",
    "taxId": "20-12345678-9",
    "address": "Av. Principal 123",
    "contactEmail": "contacto@cliente.com",
    "phoneNumber": "+54 11 1234-5678",
    "createdAt": "2025-10-30T10:00:00.000Z",
    "updatedAt": "2025-10-30T10:00:00.000Z",
    "deletedAt": null
  }
}
```

### 3. Crear un cliente

```http
POST /customers
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Cliente SA",
  "taxId": "20-12345678-9",
  "address": "Av. Principal 123",
  "contactEmail": "contacto@cliente.com",
  "phoneNumber": "+54 11 1234-5678"
}
```

**Campos:**
- `name` (requerido): Nombre del cliente
- `taxId` (opcional): CUIT/CUIL del cliente
- `address` (opcional): Dirección del cliente
- `contactEmail` (opcional): Email de contacto
- `phoneNumber` (opcional): Teléfono de contacto

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Cliente creado exitosamente",
  "data": {
    "id": "uuid",
    "name": "Cliente SA",
    "taxId": "20-12345678-9",
    "address": "Av. Principal 123",
    "contactEmail": "contacto@cliente.com",
    "phoneNumber": "+54 11 1234-5678",
    "createdAt": "2025-10-30T10:00:00.000Z",
    "updatedAt": "2025-10-30T10:00:00.000Z",
    "deletedAt": null
  }
}
```

**Errores posibles:**
- `409 Conflict`: Ya existe un cliente con ese CUIT/CUIL

### 4. Actualizar un cliente

```http
PUT /customers/:id
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Cliente SA - Actualizado",
  "address": "Nueva Dirección 456"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Cliente actualizado exitosamente",
  "data": {
    "id": "uuid",
    "name": "Cliente SA - Actualizado",
    "taxId": "20-12345678-9",
    "address": "Nueva Dirección 456",
    "contactEmail": "contacto@cliente.com",
    "phoneNumber": "+54 11 1234-5678",
    "createdAt": "2025-10-30T10:00:00.000Z",
    "updatedAt": "2025-10-30T11:00:00.000Z",
    "deletedAt": null
  }
}
```

### 5. Eliminar un cliente (soft delete)

```http
DELETE /customers/:id
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Cliente eliminado exitosamente"
}
```

### 6. Restaurar un cliente eliminado

```http
PATCH /customers/:id/restore
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Cliente restaurado exitosamente",
  "data": {
    "id": "uuid",
    "name": "Cliente SA",
    "deletedAt": null
  }
}
```

### 7. Eliminar permanentemente un cliente

```http
DELETE /customers/:id/hard
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Cliente eliminado permanentemente"
}
```

## 📡 Endpoints - Suppliers

Los endpoints de Suppliers siguen la misma estructura que Customers, con filtros similares.

### 1. Obtener todos los proveedores con filtros

```http
GET /suppliers
Authorization: Bearer {token}
```

**Query Parameters:**
- `searchTerm` (optional): Buscar por nombre del proveedor (case-insensitive)
- `minTotalSupplied` (optional): Filtrar proveedores con total suministrado mayor o igual a este valor
- `maxTotalSupplied` (optional): Filtrar proveedores con total suministrado menor o igual a este valor
- `withDeleted` (optional): `true` para incluir proveedores eliminados (soft delete)

**Ejemplos de Uso:**
```bash
# Todos los proveedores
GET /suppliers

# Proveedores principales (más de $100,000 suministrados)
GET /suppliers?minTotalSupplied=100000

# Proveedores en rango específico
GET /suppliers?minTotalSupplied=50000&maxTotalSupplied=150000

# Buscar por nombre y filtrar por total
GET /suppliers?searchTerm=agricola&minTotalSupplied=30000

# Incluir proveedores eliminados
GET /suppliers?withDeleted=true
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Insumos Agrícolas SA",
      "taxId": "20-98765432-1",
      "address": "Zona Industrial 456",
      "contactEmail": "ventas@insumos.com",
      "phoneNumber": "+54 11 5555-6666",
      "totalSupplied": 250000.75,
      "totalOrders": 8,
      "purchaseOrders": [
        {
          "id": "order-uuid",
          "status": "COMPLETADA",
          "totalAmount": 50000,
          "details": [
            {
              "id": "detail-uuid",
              "quantity": 20,
              "unitPrice": 1500.00
            }
          ]
        }
      ],
      "createdAt": "2025-10-30T10:00:00.000Z",
      "updatedAt": "2025-10-30T10:00:00.000Z",
      "deletedAt": null
    }
  ]
}
```

**Nota:** El campo `totalSupplied` se calcula automáticamente sumando `(unitPrice × quantity)` de todos los `PurchaseOrderDetails` de cada proveedor.

### 2. Otros endpoints de Suppliers

```http
GET /suppliers/:id          # Obtener por ID
POST /suppliers             # Crear (solo ADMIN)
PUT /suppliers/:id          # Actualizar (solo ADMIN)
DELETE /suppliers/:id       # Soft delete (solo ADMIN)
PATCH /suppliers/:id/restore # Restaurar (solo ADMIN)
DELETE /suppliers/:id/hard  # Eliminación permanente (solo ADMIN)
```

La estructura de requests y responses es idéntica a Customers, solo cambiando "Cliente" por "Proveedor" en los mensajes.

## 🔒 Validaciones

### Validaciones de campos:

- **name**: Requerido, debe ser texto
- **taxId**: Opcional, debe ser texto, único por entidad
- **address**: Opcional, debe ser texto
- **contactEmail**: Opcional, debe ser un email válido
- **phoneNumber**: Opcional, debe ser texto

### Validaciones de negocio:

1. **CUIT/CUIL único**: No pueden existir dos clientes o proveedores con el mismo taxId
2. **Soft delete**: Los registros eliminados se marcan con `deletedAt` pero no se borran de la base de datos
3. **Restauración**: Solo se pueden restaurar registros que están eliminados (soft delete)
4. **Hard delete**: Elimina permanentemente el registro (irreversible)

## 📁 Estructura de archivos creados

```
src/
├── dtos/
│   ├── customer.dto.ts          ✅ (ya existía)
│   └── supplier.dto.ts          ✅ (ya existía)
├── services/
│   ├── customer.service.ts      ✨ NUEVO
│   └── supplier.service.ts      ✨ NUEVO
├── controllers/
│   ├── customer.controller.ts   ✨ NUEVO
│   └── supplier.controller.ts   ✨ NUEVO
└── routes/
    ├── customer.routes.ts       ✨ NUEVO
    └── supplier.routes.ts       ✨ NUEVO
```

## 🧪 Ejemplos de uso con curl

### Crear un cliente (como ADMIN):

```bash
curl -X POST http://localhost:3000/customers \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Supermercado Central",
    "taxId": "20-33445566-7",
    "address": "Av. Comercio 789",
    "contactEmail": "ventas@supercentral.com",
    "phoneNumber": "+54 11 5555-6666"
  }'
```

### Consultar todos los proveedores (como CAPATAZ):

```bash
curl -X GET http://localhost:3000/suppliers \
  -H "Authorization: Bearer {capataz_token}"
```

### Actualizar un proveedor (como ADMIN):

```bash
curl -X PUT http://localhost:3000/suppliers/{id} \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+54 11 9999-8888"
  }'
```

## 🚀 Integración con el sistema

Las rutas están registradas en `src/index.ts`:

```typescript
app.use("/customers", createCustomerRoutes(dataSource));
app.use("/suppliers", createSupplierRoutes(dataSource));
```

Ambos endpoints requieren autenticación mediante JWT y validan los permisos según el rol del usuario.

## 🔄 Próximos pasos sugeridos

1. **Testing**: Crear tests unitarios e integración para los servicios y controladores
2. **Paginación**: Agregar paginación a los endpoints GET
3. **Búsqueda**: Implementar filtros de búsqueda (por nombre, taxId, etc.)
4. **Relaciones**: Expandir los endpoints para incluir órdenes relacionadas
5. **Historial**: Agregar endpoints para ver el historial de cambios
