# API de Órdenes de Compra - Ejemplos de Uso

## 📋 Descripción General

La API de órdenes de compra permite gestionar el ciclo completo de compras de insumos, desde la creación hasta la recepción de mercadería.

## 🔄 Flujo de Trabajo

1. **Crear** orden en estado `PENDIENTE` (precios pueden ser 0 o último costo)
2. **Editar** orden mientras está `PENDIENTE` (modificar cantidades, agregar/quitar insumos)
3. **Aprobar** orden → cambiar a `APROBADA` y establecer precios finales
4. **Recibir** mercadería → registrar recepciones (parciales o totales)

---

## 🆕 1. Crear Orden de Compra

**Endpoint:** `POST /purchase-orders`  
**Auth:** ADMIN, CAPATAZ

### Request Body

```json
{
  "supplierId": "uuid-del-proveedor",
  "details": [
    {
      "inputId": "uuid-del-insumo-1",
      "quantity": 500,
      "unitPrice": 150.50  // OPCIONAL: si no se envía, toma input.costPerUnit o 0
    },
    {
      "inputId": "uuid-del-insumo-2",
      "quantity": 200
      // Sin unitPrice → usará el último costo conocido o 0
    }
  ]
}
```

### Response (201 Created)

```json
{
  "data": {
    "id": "uuid-de-la-orden",
    "supplierId": "uuid-del-proveedor",
    "status": "PENDIENTE",
    "totalAmount": 75250.00,
    "createdAt": "2025-11-05T10:30:00Z",
    "supplier": { /* datos del proveedor */ },
    "details": [
      {
        "id": "uuid-detail-1",
        "inputId": "uuid-del-insumo-1",
        "quantity": 500,
        "unitPrice": 150.50,
        "input": { /* datos del insumo */ }
      },
      {
        "id": "uuid-detail-2",
        "inputId": "uuid-del-insumo-2",
        "quantity": 200,
        "unitPrice": 0.00  // Tomó valor por defecto
      }
    ]
  },
  "message": "Orden de compra creada exitosamente"
}
```

---

## ✏️ 2. Actualizar Orden de Compra (solo PENDIENTE)

**Endpoint:** `PUT /purchase-orders/:id`  
**Auth:** ADMIN, CAPATAZ  
**Restricción:** Solo funciona si `status = PENDIENTE`

### Casos de Uso

#### 2.1. Modificar cantidades de insumos existentes

```json
{
  "details": [
    {
      "inputId": "uuid-del-insumo-1",
      "quantity": 750,  // Cambió de 500 a 750
      "unitPrice": 150.50
    },
    {
      "inputId": "uuid-del-insumo-2",
      "quantity": 300  // Cambió de 200 a 300
    }
  ]
}
```

#### 2.2. Agregar nuevos insumos

```json
{
  "details": [
    {
      "inputId": "uuid-del-insumo-1",
      "quantity": 500,
      "unitPrice": 150.50
    },
    {
      "inputId": "uuid-del-insumo-2",
      "quantity": 200
    },
    {
      "inputId": "uuid-del-insumo-3",  // NUEVO
      "quantity": 100,
      "unitPrice": 75.00
    }
  ]
}
```

#### 2.3. Eliminar insumos

```json
{
  "details": [
    {
      "inputId": "uuid-del-insumo-1",
      "quantity": 500,
      "unitPrice": 150.50
    }
    // insumo-2 ya no está → se eliminará automáticamente
  ]
}
```

#### 2.4. Cambiar proveedor

```json
{
  "supplierId": "uuid-de-otro-proveedor"
  // Los detalles se mantienen igual
}
```

### Response (200 OK)

```json
{
  "data": { /* orden actualizada con todas las relaciones */ },
  "message": "Orden de compra actualizada exitosamente"
}
```

### Error si no está PENDIENTE (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": "No se puede modificar una orden de compra en estado APROBADA. Solo se pueden editar órdenes en estado PENDIENTE."
}
```

---

## ✅ 3. Aprobar Orden y Establecer Precios Finales

**Endpoint:** `PATCH /purchase-orders/:id/status`  
**Auth:** ADMIN, CAPATAZ

### 3.1. Aprobar con precios finales negociados

```json
{
  "status": "APROBADA",
  "details": [
    {
      "inputId": "uuid-del-insumo-1",
      "unitPrice": 145.00  // Precio negociado final (era 150.50)
    },
    {
      "inputId": "uuid-del-insumo-2",
      "unitPrice": 52.50   // Precio negociado final (era 0)
    }
  ]
}
```

### 3.2. Aprobar sin cambiar precios

```json
{
  "status": "APROBADA"
  // No se envía details → mantiene precios actuales
}
```

### 3.3. Cambiar a otros estados

```json
{
  "status": "CANCELADA"
}
```

```json
{
  "status": "CERRADA"
}
```

### Response (200 OK)

```json
{
  "data": {
    "id": "uuid-de-la-orden",
    "status": "APROBADA",
    "totalAmount": 83000.00,  // Recalculado automáticamente
    "details": [
      {
        "inputId": "uuid-del-insumo-1",
        "quantity": 500,
        "unitPrice": 145.00  // Precio actualizado
      },
      {
        "inputId": "uuid-del-insumo-2",
        "quantity": 200,
        "unitPrice": 52.50   // Precio actualizado
      }
    ]
  },
  "message": "Estado de la orden de compra actualizado a APROBADA"
}
```

---

## 📦 4. Consultar Órdenes

### 4.1. Listar todas las órdenes

**Endpoint:** `GET /purchase-orders`  
**Auth:** ADMIN, CAPATAZ

```http
GET /purchase-orders
```

### Response (200 OK)

```json
{
  "data": [
    {
      "id": "uuid-1",
      "status": "PENDIENTE",
      "totalAmount": 75250.00,
      "supplier": { /* ... */ },
      "details": [ /* ... */ ]
    },
    {
      "id": "uuid-2",
      "status": "APROBADA",
      "totalAmount": 120000.00,
      "supplier": { /* ... */ },
      "details": [ /* ... */ ]
    }
  ],
  "count": 2,
  "message": "Órdenes de compra obtenidas exitosamente"
}
```

### 4.2. Consultar orden específica

**Endpoint:** `GET /purchase-orders/:id`  
**Auth:** ADMIN, CAPATAZ

```http
GET /purchase-orders/uuid-de-la-orden
```

### Response (200 OK)

```json
{
  "data": {
    "id": "uuid-de-la-orden",
    "status": "APROBADA",
    "totalAmount": 83000.00,
    "createdAt": "2025-11-05T10:30:00Z",
    "supplier": {
      "id": "uuid-proveedor",
      "name": "Proveedor XYZ",
      "email": "contacto@proveedorxyz.com"
    },
    "details": [
      {
        "id": "uuid-detail-1",
        "input": {
          "id": "uuid-insumo-1",
          "name": "Fertilizante NPK",
          "unit": "KG"
        },
        "quantity": 500,
        "unitPrice": 145.00,
        "subtotal": 72500.00,
        "quantityReceived": 300,      // Recibido hasta ahora
        "quantityPending": 200,        // Pendiente de recibir
        "isFullyReceived": false,
        "percentageReceived": 60,
        "receiptHistory": [
          {
            "receiptId": "uuid-receipt-1",
            "quantityReceived": 300,
            "receivedAt": "2025-11-06T14:20:00Z",
            "notes": "Primera entrega parcial"
          }
        ]
      }
    ],
    "receipts": [ /* recepciones asociadas */ ]
  },
  "message": "Orden de compra obtenida exitosamente"
}
```

### 4.3. Consultar recepciones de una orden

**Endpoint:** `GET /purchase-orders/:id/receipts`  
**Auth:** ADMIN, CAPATAZ

```http
GET /purchase-orders/uuid-de-la-orden/receipts
```

### Response (200 OK)

```json
{
  "data": [
    {
      "id": "uuid-receipt-1",
      "receivedAt": "2025-11-05T14:30:00Z",
      "notes": "Primera entrega parcial - Remito #123",
      "receivedBy": {
        "id": "uuid-user",
        "name": "Juan Pérez",
        "email": "juan@example.com"
      },
      "details": [
        {
          "id": "uuid-receipt-detail-1",
          "purchaseOrderDetailId": "uuid-detail-1",
          "quantityReceived": 300,
          "notes": "Embalaje OK",
          "purchaseOrderDetail": {
            "input": {
              "name": "Fertilizante NPK",
              "unit": "KG"
            }
          }
        }
      ]
    },
    {
      "id": "uuid-receipt-2",
      "receivedAt": "2025-11-06T09:00:00Z",
      "notes": "Segunda entrega - Completó orden",
      "receivedBy": { /* ... */ },
      "details": [ /* ... */ ]
    }
  ],
  "count": 2,
  "message": "Recepciones de la orden obtenidas exitosamente"
}
```

---

## 🗑️ 5. Eliminar Orden

### 5.1. Soft Delete

**Endpoint:** `DELETE /purchase-orders/:id`  
**Auth:** ADMIN, CAPATAZ

```http
DELETE /purchase-orders/uuid-de-la-orden
```

### Response (200 OK)

```json
{
  "data": { /* orden eliminada */ },
  "message": "Orden de compra eliminada exitosamente",
  "canRestore": true
}
```

### 5.2. Restaurar Orden Eliminada

**Endpoint:** `PATCH /purchase-orders/:id/restore`  
**Auth:** ADMIN, CAPATAZ

```http
PATCH /purchase-orders/uuid-de-la-orden/restore
```

### 5.3. Hard Delete (permanente)

**Endpoint:** `DELETE /purchase-orders/:id/permanent`  
**Auth:** ADMIN only

```http
DELETE /purchase-orders/uuid-de-la-orden/permanent
```

---

## 🔍 Estados de la Orden de Compra

| Estado | Descripción | Acciones Permitidas |
|--------|-------------|---------------------|
| `PENDIENTE` | Recién creada, precios estimados | Editar detalles, aprobar, cancelar |
| `APROBADA` | Aprobada con precios finales | Registrar recepciones |
| `RECIBIDA_PARCIAL` | Parte de la mercadería recibida | Registrar más recepciones |
| `RECIBIDA` | Mercadería recibida completamente | Cerrar orden |
| `CERRADA` | Orden completada y cerrada | Solo consultar |
| `CANCELADA` | Orden cancelada | Solo consultar |

---

## 🛡️ Validaciones Importantes

### En CREATE:
- ✅ El proveedor debe existir
- ✅ Todos los insumos deben existir
- ✅ Las cantidades deben ser > 0
- ✅ El precio unitario es opcional (usa último costo o 0)

### En UPDATE:
- ✅ La orden debe estar en estado `PENDIENTE`
- ✅ Si cambia el proveedor, debe existir
- ✅ Si cambia detalles, los insumos deben existir
- ✅ No se puede cambiar el status (usar `updateStatus`)

### En UPDATE STATUS:
- ✅ El status debe ser un valor válido del enum
- ✅ Si se envían precios, los `inputId` deben pertenecer a la orden
- ✅ Los precios deben ser >= 0

---

## 💡 Casos de Uso Comunes

### Caso 1: Crear orden rápida sin precios

```json
POST /purchase-orders
{
  "supplierId": "uuid-proveedor",
  "details": [
    { "inputId": "uuid-urea", "quantity": 1000 },
    { "inputId": "uuid-npk", "quantity": 500 }
  ]
}
```

→ Crea orden con precios del último costo o 0

### Caso 2: Negociar y aprobar

```json
PATCH /purchase-orders/:id/status
{
  "status": "APROBADA",
  "details": [
    { "inputId": "uuid-urea", "unitPrice": 120.00 },
    { "inputId": "uuid-npk", "unitPrice": 145.00 }
  ]
}
```

→ Aprueba y establece precios negociados

### Caso 3: Editar orden antes de aprobar

```json
PUT /purchase-orders/:id
{
  "details": [
    { "inputId": "uuid-urea", "quantity": 1500 },  // Aumentó cantidad
    { "inputId": "uuid-npk", "quantity": 500 },
    { "inputId": "uuid-cal", "quantity": 300 }     // Agregó nuevo insumo
  ]
}
```

→ Modifica cantidades y agrega insumo

---

## 🔐 Permisos Requeridos

| Endpoint | Roles Permitidos |
|----------|------------------|
| GET (todos) | ADMIN, CAPATAZ |
| GET (por ID) | ADMIN, CAPATAZ |
| POST (crear) | ADMIN, CAPATAZ |
| PUT (actualizar) | ADMIN, CAPATAZ |
| PATCH (updateStatus) | ADMIN, CAPATAZ |
| DELETE (soft) | ADMIN, CAPATAZ |
| PATCH (restore) | ADMIN, CAPATAZ |
| DELETE (permanent) | ADMIN |
