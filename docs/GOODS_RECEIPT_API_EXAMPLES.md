# API de Recepciones de Mercadería (Goods Receipts) - Ejemplos de Uso

## 📋 Descripción General

El módulo de Recepciones de Mercadería permite registrar la entrada de insumos al almacén cuando los proveedores entregan las órdenes de compra. Actualiza automáticamente el inventario usando el método de **Costo Promedio Ponderado (CPP)**.

⚠️ **IMPORTANTE:** Las recepciones son registros inmutables que afectan el inventario. Una vez creadas, **no pueden ser eliminadas** ya que esto requeriría revertir transacciones de inventario y costo, lo cual podría generar inconsistencias contables.

## 🔄 Flujo de Trabajo

1. **Orden de Compra** debe estar en estado `APROBADA` o `RECIBIDA_PARCIAL`
2. **Registrar Recepción** → Crear GoodsReceipt con los detalles recibidos
3. **Sistema actualiza automáticamente**:
   - Stock del insumo (suma cantidad recibida)
   - Costo promedio ponderado del insumo
   - Estado de la orden de compra (RECIBIDA_PARCIAL o RECIBIDA)

---

## ✅ Requisitos Previos

Para registrar una recepción, la orden de compra debe:
- ✅ Existir y ser accesible
- ✅ Estar en estado `APROBADA` o `RECIBIDA_PARCIAL`
- ✅ Tener precios unitarios establecidos

---

## 📦 1. Crear Recepción de Mercadería

**Endpoint:** `POST /goods-receipts`  
**Auth:** ADMIN, CAPATAZ

### Request Body - Recepción Completa

```json
{
  "purchaseOrderId": "uuid-de-la-orden",
  "notes": "Entrega completa según remito #12345",
  "details": [
    {
      "purchaseOrderDetailId": "uuid-detail-urea",
      "quantityReceived": 1000,
      "notes": "Embalaje en buen estado"
    },
    {
      "purchaseOrderDetailId": "uuid-detail-npk",
      "quantityReceived": 500,
      "notes": "Se verificó humedad, OK"
    }
  ]
}
```

### Request Body - Recepción Parcial

```json
{
  "purchaseOrderId": "uuid-de-la-orden",
  "notes": "Primera entrega parcial - Remito #12345",
  "details": [
    {
      "purchaseOrderDetailId": "uuid-detail-urea",
      "quantityReceived": 400
      // De 1000 ordenados, solo llegaron 400
    }
  ]
}
```

### Response (201 Created)

```json
{
  "data": {
    "id": "uuid-receipt",
    "purchaseOrderId": "uuid-de-la-orden",
    "receivedAt": "2025-11-05T14:30:00Z",
    "notes": "Entrega completa según remito #12345",
    "purchaseOrder": {
      "id": "uuid-de-la-orden",
      "status": "RECIBIDA",  // Cambió automáticamente
      "totalAmount": 170000.00,
      "supplier": {
        "id": "uuid-proveedor",
        "name": "Proveedor XYZ"
      }
    },
    "receivedBy": {
      "id": "uuid-user",
      "name": "Juan Pérez",
      "email": "juan@example.com"
    },
    "details": [
      {
        "id": "uuid-receipt-detail-1",
        "purchaseOrderDetailId": "uuid-detail-urea",
        "quantityReceived": 1000,
        "notes": "Embalaje en buen estado",
        "purchaseOrderDetail": {
          "id": "uuid-detail-urea",
          "quantity": 1000,
          "unitPrice": 120.00,
          "input": {
            "id": "uuid-urea",
            "name": "Urea",
            "unit": "KG",
            "stock": 2500,      // Era 1500, ahora 2500 (+1000)
            "costPerUnit": 122.50  // Se recalculó con CPP
          }
        }
      },
      {
        "id": "uuid-receipt-detail-2",
        "purchaseOrderDetailId": "uuid-detail-npk",
        "quantityReceived": 500,
        "notes": "Se verificó humedad, OK",
        "purchaseOrderDetail": {
          "id": "uuid-detail-npk",
          "quantity": 500,
          "unitPrice": 145.00,
          "input": {
            "id": "uuid-npk",
            "name": "NPK 15-15-15",
            "unit": "KG",
            "stock": 1200,      // Era 700, ahora 1200 (+500)
            "costPerUnit": 143.20  // Se recalculó con CPP
          }
        }
      }
    ]
  },
  "message": "Recepción registrada exitosamente"
}
```

---

## 🔍 2. Consultar Recepciones

### 2.1. Listar Todas las Recepciones

**Endpoint:** `GET /goods-receipts`  
**Auth:** ADMIN, CAPATAZ

```http
GET /goods-receipts
```

### Response (200 OK)

```json
{
  "data": [
    {
      "id": "uuid-receipt-1",
      "receivedAt": "2025-11-05T14:30:00Z",
      "notes": "Entrega completa",
      "purchaseOrder": {
        "id": "uuid-orden-1",
        "status": "RECIBIDA",
        "supplier": { /* ... */ }
      },
      "receivedBy": { /* ... */ },
      "details": [ /* ... */ ]
    },
    {
      "id": "uuid-receipt-2",
      "receivedAt": "2025-11-04T10:15:00Z",
      "notes": "Recepción parcial",
      "purchaseOrder": { /* ... */ },
      "receivedBy": { /* ... */ },
      "details": [ /* ... */ ]
    }
  ],
  "count": 2,
  "message": "Recepciones obtenidas exitosamente"
}
```

### 2.2. Obtener Recepción por ID

**Endpoint:** `GET /goods-receipts/:id`  
**Auth:** ADMIN, CAPATAZ

```http
GET /goods-receipts/uuid-receipt
```

### Response (200 OK)

```json
{
  "data": {
    "id": "uuid-receipt",
    "receivedAt": "2025-11-05T14:30:00Z",
    "notes": "Entrega completa según remito #12345",
    "purchaseOrder": {
      "id": "uuid-orden",
      "status": "RECIBIDA",
      "totalAmount": 170000.00,
      "supplier": { /* ... */ },
      "details": [
        {
          "id": "uuid-detail-1",
          "quantity": 1000,
          "unitPrice": 120.00,
          "quantityReceived": 1000,  // Getter calculado
          "quantityPending": 0,       // Getter calculado
          "isFullyReceived": true,    // Getter calculado
          "input": { /* ... */ }
        }
      ]
    },
    "receivedBy": { /* ... */ },
    "details": [ /* ... */ ]
  },
  "message": "Recepción obtenida exitosamente"
}
```

### 2.3. Obtener Recepciones de una Orden de Compra

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
      "notes": "Primera entrega parcial",
      "receivedBy": { /* ... */ },
      "details": [
        {
          "purchaseOrderDetailId": "uuid-detail-1",
          "quantityReceived": 400,
          "notes": "Parcial"
        }
      ]
    },
    {
      "id": "uuid-receipt-2",
      "receivedAt": "2025-11-06T09:00:00Z",
      "notes": "Segunda entrega parcial",
      "receivedBy": { /* ... */ },
      "details": [
        {
          "purchaseOrderDetailId": "uuid-detail-1",
          "quantityReceived": 600,
          "notes": "Completó la orden"
        }
      ]
    }
  ],
  "count": 2,
  "message": "Recepciones de la orden obtenidas exitosamente"
}
```

---

## ⚠️ Inmutabilidad de Recepciones

Las recepciones **NO PUEDEN SER ELIMINADAS** una vez creadas. Esto es por diseño, ya que:

1. **Afectan el inventario:** Al crear una recepción, se suma stock y se actualiza el costo promedio ponderado
2. **Integridad contable:** Eliminar una recepción requeriría revertir cálculos de CPP que pueden haber sido usados en otras transacciones
3. **Auditoría:** Las recepciones deben mantenerse como registro histórico inmutable

### ¿Qué hacer si hay un error?

Si se registró una recepción incorrecta:

1. **Documentar el error:** Agregar notas en la orden de compra sobre la discrepancia
2. **Ajuste de inventario:** Crear un ajuste manual de inventario (módulo separado)
3. **Contactar soporte:** Para casos excepcionales que requieren reversión a nivel de base de datos

---

## 🗑️ Endpoints de Eliminación Removidos

Los siguientes endpoints han sido **removidos** del sistema:

- ❌ `DELETE /goods-receipts/:id` (soft delete)
- ❌ `PATCH /goods-receipts/:id/restore` (restaurar)
- ❌ `DELETE /goods-receipts/:id/permanent` (hard delete)

---

## 🔄 Cálculo de Costo Promedio Ponderado (CPP)

### Fórmula

```
Nuevo CPP = ((Stock Actual × Costo Actual) + (Cantidad Recibida × Costo de Compra)) / Nuevo Stock Total
```

### Ejemplo

**Estado Inicial:**
- Stock actual: 1500 kg
- Costo actual: $125.00/kg
- Valor en inventario: $187,500.00

**Recepción Nueva:**
- Cantidad recibida: 1000 kg
- Costo de compra: $120.00/kg
- Valor de compra: $120,000.00

**Cálculo:**
```
Nuevo Stock = 1500 + 1000 = 2500 kg
Nuevo CPP = ((1500 × 125) + (1000 × 120)) / 2500
Nuevo CPP = (187,500 + 120,000) / 2500
Nuevo CPP = 307,500 / 2500
Nuevo CPP = $123.00/kg
```

**Estado Final:**
- Stock: 2500 kg
- Costo por unidad: $123.00/kg
- Valor en inventario: $307,500.00

---

## ✅ Validaciones Implementadas

### Al Crear Recepción:

1. **Orden de Compra:**
   - ✅ Debe existir
   - ✅ Debe estar en estado `APROBADA` o `RECIBIDA_PARCIAL`

2. **Detalles:**
   - ✅ Todos los `purchaseOrderDetailId` deben pertenecer a la orden
   - ✅ La cantidad recibida no puede exceder la cantidad pendiente
   - ✅ La cantidad recibida debe ser > 0

3. **Inventario:**
   - ✅ Los insumos deben existir
   - ✅ El stock se actualiza correctamente
   - ✅ El CPP se calcula correctamente

4. **Estado de Orden:**
   - ✅ Si todos los detalles están completos → `RECIBIDA`
   - ✅ Si algunos detalles están pendientes → `RECIBIDA_PARCIAL`

---

## 🎯 Casos de Uso

### Caso 1: Recepción Completa

```json
POST /goods-receipts
{
  "purchaseOrderId": "uuid-orden",
  "notes": "Entrega completa - Remito #123",
  "details": [
    { "purchaseOrderDetailId": "uuid-d1", "quantityReceived": 1000 },
    { "purchaseOrderDetailId": "uuid-d2", "quantityReceived": 500 }
  ]
}
```
→ Orden pasa a estado `RECIBIDA`

### Caso 2: Recepción Parcial (Primera Entrega)

```json
POST /goods-receipts
{
  "purchaseOrderId": "uuid-orden",
  "notes": "Primera entrega - Remito #123",
  "details": [
    { "purchaseOrderDetailId": "uuid-d1", "quantityReceived": 400 }
    // Faltan 600 kg
  ]
}
```
→ Orden pasa a estado `RECIBIDA_PARCIAL`

### Caso 3: Recepción Parcial (Segunda Entrega)

```json
POST /goods-receipts
{
  "purchaseOrderId": "uuid-orden",
  "notes": "Segunda entrega - Remito #124",
  "details": [
    { "purchaseOrderDetailId": "uuid-d1", "quantityReceived": 600 }
    // Completa los 1000 kg
  ]
}
```
→ Orden pasa a estado `RECIBIDA`

### Caso 4: Error - Excede Cantidad Pendiente

```json
POST /goods-receipts
{
  "purchaseOrderId": "uuid-orden",
  "details": [
    { "purchaseOrderDetailId": "uuid-d1", "quantityReceived": 700 }
    // Error: Solo faltan 600 kg
  ]
}
```
→ **Error 400:** "No se puede recibir 700 KG de 'Urea'. Cantidad pendiente: 600 KG"

### Caso 5: Error - Orden No Aprobada

```json
POST /goods-receipts
{
  "purchaseOrderId": "uuid-orden-pendiente",
  "details": [ /* ... */ ]
}
```
→ **Error 400:** "No se puede registrar recepción para una orden en estado PENDIENTE. La orden debe estar APROBADA o en RECIBIDA_PARCIAL."

---

## 📊 Seguimiento de Recepciones

Para ver el historial completo de una orden:

```http
GET /purchase-orders/uuid-orden
```

La respuesta incluye:
- Detalles de la orden con cantidades ordenadas
- `quantityReceived`: Total recibido hasta ahora (calculado)
- `quantityPending`: Pendiente de recibir (calculado)
- `isFullyReceived`: Si está completo (calculado)
- `receiptHistory`: Lista de todas las recepciones

```json
{
  "data": {
    "id": "uuid-orden",
    "status": "RECIBIDA_PARCIAL",
    "details": [
      {
        "input": { "name": "Urea" },
        "quantity": 1000,
        "unitPrice": 120.00,
        "quantityReceived": 400,      // De 2 recepciones
        "quantityPending": 600,
        "isFullyReceived": false,
        "percentageReceived": 40,
        "receiptHistory": [
          {
            "receiptId": "uuid-r1",
            "quantityReceived": 300,
            "receivedAt": "2025-11-05T10:00:00Z",
            "notes": "Primera entrega"
          },
          {
            "receiptId": "uuid-r2",
            "quantityReceived": 100,
            "receivedAt": "2025-11-06T14:00:00Z",
            "notes": "Segunda entrega"
          }
        ]
      }
    ]
  }
}
```

---

## 🔐 Permisos Requeridos

| Endpoint | Roles Permitidos |
|----------|------------------|
| GET /goods-receipts | ADMIN, CAPATAZ |
| GET /goods-receipts/:id | ADMIN, CAPATAZ |
| POST /goods-receipts | ADMIN, CAPATAZ |
| GET /purchase-orders/:id/receipts | ADMIN, CAPATAZ |

---

## ⚠️ Consideraciones Importantes

1. **Transaccionalidad:** Todo el proceso de recepción es atómico. Si falla cualquier parte, se revierte todo.

2. **Inmutabilidad:** Las recepciones NO pueden ser eliminadas. Son registros contables permanentes.

3. **Costo Promedio:** El CPP se calcula automáticamente y no puede ser modificado manualmente.

4. **Múltiples Recepciones:** Puedes crear múltiples recepciones para la misma orden (entregas parciales).

5. **Usuario Receptor:** Se registra automáticamente el usuario autenticado que crea la recepción.

6. **Timestamps:** La fecha/hora de recepción (`receivedAt`) se establece automáticamente al crear.

7. **Corrección de Errores:** Si se registra una recepción incorrecta, se debe crear un ajuste manual de inventario, no eliminar la recepción.
