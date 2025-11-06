# Actualización de Precios en Órdenes de Compra

## Cambios Importantes

Los métodos de actualización ahora usan el **ID del detalle (PK)** en lugar del `inputId` para actualizar precios. Esto es más eficiente y evita ambigüedades cuando hay múltiples detalles con el mismo insumo.

---

## 1. Actualizar Status y Precios (aprobar orden)

### Endpoint
```
PATCH /purchase-orders/:id/status
```

### Request Body (ANTES - ❌ NO usar)
```json
{
  "status": "APROBADA",
  "details": [
    {
      "inputId": "uuid-del-insumo-1",
      "unitPrice": 750.00
    },
    {
      "inputId": "uuid-del-insumo-2",
      "unitPrice": 820.00
    }
  ]
}
```

### Request Body (AHORA - ✅ Usar)
```json
{
  "status": "APROBADA",
  "details": [
    {
      "detailId": "uuid-del-detalle-1",
      "unitPrice": 750.00
    },
    {
      "detailId": "uuid-del-detalle-2",
      "unitPrice": 820.00
    }
  ]
}
```

### ¿Cómo obtener los `detailId`?

Cuando obtienes una orden de compra (GET /purchase-orders/:id), recibes:

```json
{
  "id": "orden-uuid",
  "status": "PENDIENTE",
  "details": [
    {
      "id": "detalle-uuid-1",          // ← Este es el detailId
      "inputId": "insumo-uuid-1",
      "quantity": 100,
      "unitPrice": 680.00,
      "input": {
        "id": "insumo-uuid-1",
        "name": "Fertilizante NPK"
      }
    },
    {
      "id": "detalle-uuid-2",          // ← Este es el detailId
      "inputId": "insumo-uuid-2",
      "quantity": 200,
      "unitPrice": 750.00,
      "input": {
        "id": "insumo-uuid-2",
        "name": "Herbicida"
      }
    }
  ]
}
```

### Ventajas del nuevo enfoque

1. **✅ Más eficiente**: Actualiza directamente usando la Primary Key
2. **✅ Sin ambigüedad**: No hay confusión si una orden tiene múltiples detalles del mismo insumo
3. **✅ Más seguro**: Valida que el detalle pertenezca a la orden antes de actualizar

---

## 2. Actualizar Orden Completa (orden PENDIENTE)

### Endpoint
```
PUT /purchase-orders/:id
```

### Casos de uso:

#### A) Actualizar un detalle existente (cambiar cantidad o precio)

```json
{
  "details": [
    {
      "id": "detalle-uuid-1",          // Usar el ID del detalle existente
      "quantity": 150,                  // Nueva cantidad
      "unitPrice": 700.00              // Nuevo precio (opcional)
    }
  ]
}
```

#### B) Agregar un nuevo insumo a la orden

```json
{
  "details": [
    {
      "inputId": "insumo-uuid-3",      // No tiene id, usa inputId
      "quantity": 50,
      "unitPrice": 500.00
    }
  ]
}
```

#### C) Actualizar todo: mantener algunos, modificar otros, agregar nuevos

```json
{
  "details": [
    // Mantener detalle 1 sin cambios (se eliminarán los que no estén aquí)
    {
      "id": "detalle-uuid-1",
      "quantity": 100,
      "unitPrice": 680.00
    },
    // Modificar detalle 2
    {
      "id": "detalle-uuid-2",
      "quantity": 250,                  // Cambió la cantidad
      "unitPrice": 800.00              // Cambió el precio
    },
    // Agregar nuevo insumo
    {
      "inputId": "insumo-uuid-4",
      "quantity": 75,
      "unitPrice": 950.00
    }
  ]
}
```

**Importante**: Los detalles que NO estén en el array se eliminarán de la orden.

---

## 3. Ejemplos de Frontend

### React/TypeScript - Aprobar orden con precios actualizados

```typescript
interface PurchaseOrderDetail {
  id: string;
  inputId: string;
  quantity: number;
  unitPrice: number;
  input: {
    id: string;
    name: string;
  };
}

interface PurchaseOrder {
  id: string;
  status: string;
  details: PurchaseOrderDetail[];
}

// 1. Obtener la orden
const order = await fetchPurchaseOrder(orderId);

// 2. El usuario actualiza precios en el UI
const updatedPrices = {
  [order.details[0].id]: 750.00,  // Usa el ID del detalle, no del insumo
  [order.details[1].id]: 820.00,
};

// 3. Preparar el payload para aprobar
const payload = {
  status: 'APROBADA',
  details: order.details.map(detail => ({
    detailId: detail.id,                        // ✅ Usar detail.id
    unitPrice: updatedPrices[detail.id] || detail.unitPrice,
  })),
};

// 4. Enviar al backend
await updatePurchaseOrderStatus(orderId, payload);
```

### React/TypeScript - Editar orden PENDIENTE

```typescript
// Escenario: Usuario edita cantidades y agrega un insumo nuevo

const onSubmit = async (formData: any) => {
  const payload = {
    details: [
      // Detalles existentes (con su id)
      ...existingDetails.map(detail => ({
        id: detail.id,                    // ✅ Incluir el ID del detalle
        quantity: formData[`qty_${detail.id}`],
        unitPrice: formData[`price_${detail.id}`],
      })),
      // Nuevos insumos (con inputId)
      ...newInputs.map(input => ({
        inputId: input.inputId,           // ✅ Usar inputId para nuevos
        quantity: input.quantity,
        unitPrice: input.unitPrice,
      })),
    ],
  };

  await updatePurchaseOrder(orderId, payload);
};
```

---

## 4. Validaciones

### En `updateStatus`:
- ✅ Valida que todos los `detailId` existan en la orden
- ✅ Rechaza si algún `detailId` no pertenece a la orden
- ✅ Recalcula automáticamente el `totalAmount`

### En `update`:
- ✅ Solo permite editar órdenes en estado `PENDIENTE`
- ✅ Valida que los `id` de detalles existan en la orden
- ✅ Valida que los `inputId` de nuevos insumos existan en la BD
- ✅ Elimina detalles que no estén en el payload
- ✅ Recalcula automáticamente el `totalAmount`

---

## 5. Mensajes de Error

### Error: detailId no pertenece a la orden
```json
{
  "statusCode": 400,
  "message": "Los siguientes IDs de detalles no pertenecen a esta orden: uuid-1, uuid-2"
}
```

### Error: intentar editar orden no PENDIENTE
```json
{
  "statusCode": 400,
  "message": "No se puede modificar una orden de compra en estado APROBADA. Solo se pueden editar órdenes en estado PENDIENTE."
}
```

### Error: inputId no encontrado
```json
{
  "statusCode": 404,
  "message": "Uno o más insumos no fueron encontrados"
}
```

---

## 6. Migración desde el sistema anterior

Si tienes código frontend que usaba `inputId`, debes cambiarlo:

```typescript
// ❌ ANTES
const payload = {
  status: 'APROBADA',
  details: order.details.map(detail => ({
    inputId: detail.inputId,    // ❌ Ya no funciona
    unitPrice: newPrice,
  })),
};

// ✅ AHORA
const payload = {
  status: 'APROBADA',
  details: order.details.map(detail => ({
    detailId: detail.id,        // ✅ Usar el ID del detalle
    unitPrice: newPrice,
  })),
};
```

---

## Resumen

| Operación | Campo a usar | Cuándo |
|-----------|-------------|--------|
| Actualizar precio en `updateStatus` | `detailId` | Siempre |
| Actualizar detalle existente en `update` | `id` | Cuando el detalle ya existe |
| Crear nuevo detalle en `update` | `inputId` | Cuando agregas un insumo nuevo |
