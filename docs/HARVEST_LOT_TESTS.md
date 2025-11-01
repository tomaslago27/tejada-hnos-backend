# 🧪 Tests para Lotes de Cosecha (HarvestLot) - B2.7

## 📋 Criterios de Aceptación

✅ **Criterio 1**: Un CAPATAZ puede registrar un lote de 5000kg brutos para la Parcela A-01  
✅ **Criterio 2**: Un ADMIN actualiza ese lote con 2500kg netos y el `yieldPercentage` se calcula automáticamente como 50.00

---

## 🔐 Pre-requisitos

### 1. Obtener tokens de autenticación

```http
### Login como ADMIN
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "Admin123!"
}

### Respuesta esperada
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-admin",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}

### Login como CAPATAZ
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "capataz@example.com",
  "password": "Capataz123!"
}

### Respuesta esperada
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-capataz",
    "email": "capataz@example.com",
    "role": "CAPATAZ"
  }
}
```

### 2. Obtener IDs necesarios

```http
### Listar parcelas (para obtener ID de Parcela A-01)
GET http://localhost:3000/plots
Authorization: Bearer {{admin_token}}

### Ejemplo de respuesta
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Parcela A-01",
      "area": "5.5",
      "field": {
        "id": "field-uuid",
        "name": "Campo Norte"
      },
      "variety": {
        "id": "variety-uuid",
        "name": "Chandler"
      }
    }
  ]
}
```

---

## ✅ Test 1: CAPATAZ registra lote de 5000kg (Criterio 1)

```http
### POST /harvest-lots - Crear lote con peso bruto (como CAPATAZ)
POST http://localhost:3000/harvest-lots
Authorization: Bearer {{capataz_token}}
Content-Type: application/json

{
  "plotId": "550e8400-e29b-41d4-a716-446655440001",
  "harvestDate": "2025-10-30",
  "lotCode": "LOT-A01-2025-001",
  "varietyName": "Chandler",
  "caliber": "LARGE",
  "grossWeightKg": 5000.00
}

### ✅ Respuesta esperada: 201 Created
{
  "data": {
    "id": "harvest-lot-uuid",
    "plotId": "550e8400-e29b-41d4-a716-446655440001",
    "harvestDate": "2025-10-30",
    "lotCode": "LOT-A01-2025-001",
    "varietyName": "Chandler",
    "caliber": "LARGE",
    "grossWeightKg": "5000.00",
    "netWeightKg": null,
    "yieldPercentage": null,
    "status": "PENDIENTE_PROCESO",
    "plot": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Parcela A-01",
      "field": {
        "name": "Campo Norte"
      },
      "variety": {
        "name": "Chandler"
      }
    },
    "createdAt": "2025-10-30T10:00:00.000Z",
    "updatedAt": "2025-10-30T10:00:00.000Z"
  },
  "message": "Lote de cosecha creado exitosamente."
}

### ✅ Verificaciones:
# - Status code: 201
# - netWeightKg: null (aún no procesado)
# - yieldPercentage: null (aún no procesado)
# - status: "PENDIENTE_PROCESO"
# - CAPATAZ pudo crear el lote
```

---

## ✅ Test 2: ADMIN actualiza con peso neto y calcula rendimiento (Criterio 2)

```http
### PUT /harvest-lots/:id - Actualizar con peso neto (como ADMIN)
PUT http://localhost:3000/harvest-lots/{{harvest_lot_id}}
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "netWeightKg": 2500.00
}

### ✅ Respuesta esperada: 200 OK
{
  "data": {
    "id": "harvest-lot-uuid",
    "plotId": "550e8400-e29b-41d4-a716-446655440001",
    "harvestDate": "2025-10-30",
    "lotCode": "LOT-A01-2025-001",
    "varietyName": "Chandler",
    "caliber": "LARGE",
    "grossWeightKg": "5000.00",
    "netWeightKg": "2500.00",
    "yieldPercentage": "50.00",
    "status": "EN_STOCK",
    "plot": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Parcela A-01"
    },
    "createdAt": "2025-10-30T10:00:00.000Z",
    "updatedAt": "2025-10-30T10:15:00.000Z"
  },
  "message": "Lote de cosecha actualizado exitosamente."
}

### ✅ Verificaciones:
# - Status code: 200
# - netWeightKg: "2500.00"
# - yieldPercentage: "50.00" (calculado automáticamente: 2500/5000 * 100)
# - status: "EN_STOCK" (cambió automáticamente al registrar peso neto)
# - Solo ADMIN pudo actualizar
```

---

## 🧪 Tests Adicionales

### Test 3: Listar todos los lotes (CAPATAZ o ADMIN)

```http
### GET /harvest-lots - Listar todos
GET http://localhost:3000/harvest-lots
Authorization: Bearer {{admin_token}}

### ✅ Respuesta esperada: 200 OK
{
  "data": [
    {
      "id": "harvest-lot-uuid",
      "lotCode": "LOT-A01-2025-001",
      "grossWeightKg": "5000.00",
      "netWeightKg": "2500.00",
      "yieldPercentage": "50.00",
      "status": "EN_STOCK",
      "harvestDate": "2025-10-30",
      "plot": {
        "name": "Parcela A-01",
        "field": {
          "name": "Campo Norte"
        }
      }
    }
  ],
  "count": 1,
  "message": "Lotes de cosecha obtenidos exitosamente."
}
```

### Test 4: Obtener un lote por ID

```http
### GET /harvest-lots/:id - Ver detalle de un lote
GET http://localhost:3000/harvest-lots/{{harvest_lot_id}}
Authorization: Bearer {{admin_token}}

### ✅ Respuesta esperada: 200 OK
{
  "data": {
    "id": "harvest-lot-uuid",
    "plotId": "550e8400-e29b-41d4-a716-446655440001",
    "harvestDate": "2025-10-30",
    "lotCode": "LOT-A01-2025-001",
    "varietyName": "Chandler",
    "caliber": "LARGE",
    "grossWeightKg": "5000.00",
    "netWeightKg": "2500.00",
    "yieldPercentage": "50.00",
    "status": "EN_STOCK",
    "plot": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Parcela A-01",
      "field": {
        "id": "field-uuid",
        "name": "Campo Norte"
      },
      "variety": {
        "id": "variety-uuid",
        "name": "Chandler"
      }
    },
    "shipmentDetails": [],
    "createdAt": "2025-10-30T10:00:00.000Z",
    "updatedAt": "2025-10-30T10:15:00.000Z"
  },
  "message": "Lote de cosecha obtenido exitosamente."
}
```

### Test 5: Filtrar lotes por parcela

```http
### GET /harvest-lots?plotId=... - Filtrar por parcela
GET http://localhost:3000/harvest-lots?plotId=550e8400-e29b-41d4-a716-446655440001
Authorization: Bearer {{admin_token}}

### ✅ Respuesta esperada: 200 OK
{
  "data": [
    {
      "id": "harvest-lot-uuid",
      "lotCode": "LOT-A01-2025-001",
      "plot": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Parcela A-01"
      }
    }
  ],
  "count": 1,
  "message": "Lotes de cosecha obtenidos exitosamente."
}
```

### Test 6: Filtrar por estado

```http
### GET /harvest-lots?status=EN_STOCK - Filtrar lotes en stock
GET http://localhost:3000/harvest-lots?status=EN_STOCK
Authorization: Bearer {{admin_token}}

### GET /harvest-lots?status=PENDIENTE_PROCESO - Filtrar lotes pendientes
GET http://localhost:3000/harvest-lots?status=PENDIENTE_PROCESO
Authorization: Bearer {{admin_token}}
```

### Test 7: Filtrar por rango de peso

```http
### GET /harvest-lots - Filtrar por peso bruto
GET http://localhost:3000/harvest-lots?minGrossWeight=3000&maxGrossWeight=6000
Authorization: Bearer {{admin_token}}

### ✅ Respuesta esperada: Lotes entre 3000kg y 6000kg
```

### Test 8: Filtrar por rango de fechas

```http
### GET /harvest-lots - Filtrar por fechas
GET http://localhost:3000/harvest-lots?startDate=2025-10-01&endDate=2025-10-31
Authorization: Bearer {{admin_token}}

### ✅ Respuesta esperada: Lotes cosechados en octubre 2025
```

### Test 9: Filtrar por variedad

```http
### GET /harvest-lots?varietyName=Chandler - Buscar por variedad
GET http://localhost:3000/harvest-lots?varietyName=Chandler
Authorization: Bearer {{admin_token}}

### ✅ Respuesta esperada: Lotes de variedad Chandler
```

### Test 10: Filtros combinados

```http
### GET /harvest-lots - Múltiples filtros
GET http://localhost:3000/harvest-lots?plotId=550e8400-e29b-41d4-a716-446655440001&status=EN_STOCK&minGrossWeight=4000
Authorization: Bearer {{admin_token}}

### ✅ Respuesta esperada: Lotes de la parcela A-01, en stock, con más de 4000kg brutos
```

### Test 11: Eliminar lote (Soft Delete - Solo ADMIN)

```http
### DELETE /harvest-lots/:id - Soft delete
DELETE http://localhost:3000/harvest-lots/{{harvest_lot_id}}
Authorization: Bearer {{admin_token}}

### ✅ Respuesta esperada: 200 OK
{
  "message": "Lote de cosecha eliminado exitosamente."
}
```

### Test 12: Restaurar lote eliminado (Solo ADMIN)

```http
### POST /harvest-lots/:id/restore - Restaurar
POST http://localhost:3000/harvest-lots/{{harvest_lot_id}}/restore
Authorization: Bearer {{admin_token}}

### ✅ Respuesta esperada: 200 OK
{
  "data": {
    "id": "harvest-lot-uuid",
    "lotCode": "LOT-A01-2025-001",
    "deletedAt": null
  },
  "message": "Lote de cosecha restaurado exitosamente."
}
```

---

## ❌ Tests de Validación de Errores

### Test 13: CAPATAZ intenta actualizar peso neto (debe fallar)

```http
### PUT /harvest-lots/:id - Capataz NO puede actualizar (403 Forbidden)
PUT http://localhost:3000/harvest-lots/{{harvest_lot_id}}
Authorization: Bearer {{capataz_token}}
Content-Type: application/json

{
  "netWeightKg": 2500.00
}

### ❌ Respuesta esperada: 403 Forbidden
{
  "message": "No tienes permisos para acceder a este recurso",
  "requiredRoles": ["ADMIN"],
  "userRole": "CAPATAZ"
}
```

### Test 14: Crear lote con código duplicado

```http
### POST /harvest-lots - Código duplicado (409 Conflict)
POST http://localhost:3000/harvest-lots
Authorization: Bearer {{capataz_token}}
Content-Type: application/json

{
  "plotId": "550e8400-e29b-41d4-a716-446655440001",
  "harvestDate": "2025-10-30",
  "lotCode": "LOT-A01-2025-001",
  "varietyName": "Chandler",
  "grossWeightKg": 3000.00
}

### ❌ Respuesta esperada: 409 Conflict
{
  "message": "Ya existe un lote con el código LOT-A01-2025-001."
}
```

### Test 15: Crear lote con parcela inexistente

```http
### POST /harvest-lots - Parcela no existe (404 Not Found)
POST http://localhost:3000/harvest-lots
Authorization: Bearer {{capataz_token}}
Content-Type: application/json

{
  "plotId": "00000000-0000-0000-0000-000000000000",
  "harvestDate": "2025-10-30",
  "lotCode": "LOT-INVALID-001",
  "varietyName": "Chandler",
  "grossWeightKg": 5000.00
}

### ❌ Respuesta esperada: 404 Not Found
{
  "message": "La parcela con ID 00000000-0000-0000-0000-000000000000 no fue encontrada."
}
```

### Test 16: Validación de campos obligatorios

```http
### POST /harvest-lots - Campos faltantes (400 Bad Request)
POST http://localhost:3000/harvest-lots
Authorization: Bearer {{capataz_token}}
Content-Type: application/json

{
  "plotId": "550e8400-e29b-41d4-a716-446655440001"
}

### ❌ Respuesta esperada: 400 Bad Request
{
  "errors": [
    "La fecha de cosecha es obligatoria",
    "El código de lote no puede estar vacío",
    "El nombre de la variedad no puede estar vacío",
    "El peso bruto es obligatorio"
  ]
}
```

### Test 17: Sin autenticación (401 Unauthorized)

```http
### POST /harvest-lots - Sin token (401 Unauthorized)
POST http://localhost:3000/harvest-lots
Content-Type: application/json

{
  "plotId": "550e8400-e29b-41d4-a716-446655440001",
  "harvestDate": "2025-10-30",
  "lotCode": "LOT-TEST-001",
  "varietyName": "Chandler",
  "grossWeightKg": 5000.00
}

### ❌ Respuesta esperada: 401 Unauthorized
{
  "message": "No se proporcionó token de autenticación"
}
```

---

## 📊 Casos de Uso Completos

### Caso 1: Flujo completo de cosecha y procesamiento

```http
### 1. CAPATAZ crea lote recién cosechado (húmedo)
POST http://localhost:3000/harvest-lots
Authorization: Bearer {{capataz_token}}
Content-Type: application/json

{
  "plotId": "550e8400-e29b-41d4-a716-446655440001",
  "harvestDate": "2025-10-30",
  "lotCode": "LOT-A01-2025-002",
  "varietyName": "Chandler",
  "caliber": "LARGE",
  "grossWeightKg": 8000.00
}

### 2. Verificar que está pendiente de proceso
GET http://localhost:3000/harvest-lots?status=PENDIENTE_PROCESO
Authorization: Bearer {{admin_token}}

### 3. ADMIN actualiza después del secado (10 días después)
PUT http://localhost:3000/harvest-lots/{{harvest_lot_id}}
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "netWeightKg": 3600.00
}

### 4. Verificar cálculo de rendimiento
# yieldPercentage = (3600 / 8000) * 100 = 45.00%

### 5. Verificar que cambió a EN_STOCK
GET http://localhost:3000/harvest-lots/{{harvest_lot_id}}
Authorization: Bearer {{admin_token}}
```

### Caso 2: Registro de múltiples lotes del mismo día

```http
### Lote 1 - Parcela A-01
POST http://localhost:3000/harvest-lots
Authorization: Bearer {{capataz_token}}
Content-Type: application/json

{
  "plotId": "550e8400-e29b-41d4-a716-446655440001",
  "harvestDate": "2025-10-30",
  "lotCode": "LOT-A01-2025-M1",
  "varietyName": "Chandler",
  "caliber": "JUMBO",
  "grossWeightKg": 3500.00
}

### Lote 2 - Parcela A-01 (tarde)
POST http://localhost:3000/harvest-lots
Authorization: Bearer {{capataz_token}}
Content-Type: application/json

{
  "plotId": "550e8400-e29b-41d4-a716-446655440001",
  "harvestDate": "2025-10-30",
  "lotCode": "LOT-A01-2025-T1",
  "varietyName": "Chandler",
  "caliber": "LARGE",
  "grossWeightKg": 4200.00
}

### Listar todos los lotes de la parcela
GET http://localhost:3000/harvest-lots?plotId=550e8400-e29b-41d4-a716-446655440001
Authorization: Bearer {{admin_token}}
```

---

## 🎯 Checklist de Verificación

### Criterios de Aceptación B2.7
- [ ] ✅ CAPATAZ puede crear lote con 5000kg brutos para Parcela A-01
- [ ] ✅ ADMIN puede actualizar con 2500kg netos
- [ ] ✅ `yieldPercentage` se calcula automáticamente como 50.00
- [ ] ✅ Estado cambia de PENDIENTE_PROCESO a EN_STOCK al registrar peso neto

### Permisos
- [ ] ✅ CAPATAZ puede crear lotes
- [ ] ✅ ADMIN puede crear lotes
- [ ] ✅ OPERARIO NO puede crear lotes (si se prueba)
- [ ] ✅ Solo ADMIN puede actualizar (PUT)
- [ ] ✅ Solo ADMIN puede eliminar (DELETE)
- [ ] ✅ CAPATAZ puede listar (GET)

### Validaciones
- [ ] ✅ No permite códigos de lote duplicados
- [ ] ✅ Valida que la parcela exista
- [ ] ✅ Valida campos obligatorios (lotCode, harvestDate, varietyName, grossWeightKg)
- [ ] ✅ Peso bruto debe ser > 0
- [ ] ✅ Fecha debe ser válida (ISO8601)

### Funcionalidades
- [ ] ✅ Listar todos los lotes
- [ ] ✅ Filtrar por parcela
- [ ] ✅ Filtrar por estado
- [ ] ✅ Filtrar por rango de peso
- [ ] ✅ Filtrar por rango de fechas
- [ ] ✅ Filtrar por variedad
- [ ] ✅ Combinar múltiples filtros
- [ ] ✅ Ver detalle de un lote
- [ ] ✅ Soft delete
- [ ] ✅ Restaurar lote eliminado

### Cálculos
- [ ] ✅ `yieldPercentage` se calcula correctamente: (neto / bruto) * 100
- [ ] ✅ Se redondea a 2 decimales
- [ ] ✅ Estado cambia automáticamente a EN_STOCK al registrar peso neto

---

## 🛠️ Herramientas Recomendadas

### VS Code REST Client
1. Instalar extensión "REST Client" (humao.rest-client)
2. Crear archivo `harvest-lot-tests.http` con los ejemplos
3. Usar variables:
```http
@baseUrl = http://localhost:3000
@admin_token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
@capataz_token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
@plot_id = 550e8400-e29b-41d4-a716-446655440001
@harvest_lot_id = harvest-lot-uuid

### Ejemplo de uso
POST {{baseUrl}}/harvest-lots
Authorization: Bearer {{capataz_token}}
```

### Postman
1. Crear colección "Harvest Lots"
2. Configurar variables de entorno
3. Usar Pre-request Scripts para automatizar
4. Crear Tests con assertions:
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Yield percentage is calculated correctly", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.yieldPercentage).to.eql("50.00");
});
```

### cURL (PowerShell)
```powershell
# POST - Crear lote
curl -X POST http://localhost:3000/harvest-lots `
  -H "Authorization: Bearer $admin_token" `
  -H "Content-Type: application/json" `
  -d '{\"plotId\":\"550e8400-e29b-41d4-a716-446655440001\",\"harvestDate\":\"2025-10-30\",\"lotCode\":\"LOT-A01-2025-001\",\"varietyName\":\"Chandler\",\"grossWeightKg\":5000.00}'
```

---

## 📝 Notas Importantes

1. **Reemplaza los UUIDs** con los valores reales de tu base de datos
2. **Tokens JWT** expiran, obtén tokens frescos si es necesario
3. **Orden de ejecución**: Primero crear usuarios y parcelas, luego lotes
4. **Base de datos**: Asegúrate de que existe y está sincronizada
5. **Puerto**: Verifica que el servidor esté corriendo en el puerto correcto (ENV.PORT)
