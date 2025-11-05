# Resumen: Sistema de Seguimiento de Recepciones Mejorado

## ✅ Estado Actual

Tu sistema **SÍ ES CAPAZ** de rastrear cantidades recibidas vs. pendientes de cada insumo. La estructura está correctamente implementada.

## 📊 Estructura de Entidades (Actualizada)

### Entidades Principales:

1. **`PurchaseOrder`** - Orden de Compra
   - Contiene información general de la compra
   - Relacionada con múltiples `PurchaseOrderDetail`
   - Relacionada con múltiples `GoodsReceipt`

2. **`PurchaseOrderDetail`** - Detalle de Orden ⭐
   - Define **QUÉ y CUÁNTO** se pidió de cada insumo
   - Relacionado con múltiples `GoodsReceiptDetail`
   - **Nuevos campos virtuales:**
     - `quantityReceived`: Total recibido (suma de todos los remitos)
     - `quantityPending`: Cantidad pendiente
     - `isFullyReceived`: ¿Está completo?

3. **`GoodsReceipt`** - Remito de Recepción
   - Representa un evento de recepción física
   - Contiene múltiples `GoodsReceiptDetail`

4. **`GoodsReceiptDetail`** ⭐ NUEVO
   - Define **QUÉ y CUÁNTO** se recibió en cada remito específico
   - Vincula el remito con el detalle de la orden original
   - Permite recepciones parciales

## 🎯 Cómo Obtener la Información

### Query Completo en TypeORM:

```typescript
const order = await purchaseOrderRepo.findOne({
  where: { id: orderId },
  relations: [
    'supplier',                              // Info del proveedor
    'details',                               // Detalles pedidos
    'details.input',                         // Info de cada insumo
    'details.receiptDetails',                // Detalles recibidos
    'details.receiptDetails.goodsReceipt',   // Info del remito
    'receipts',                              // Todos los remitos
    'receipts.details',                      // Detalles de cada remito
  ],
});

// Para cada detalle:
order.details.forEach(detail => {
  console.log({
    insumo: detail.input.name,
    pedido: detail.quantity,
    recibido: detail.quantityReceived,    // ← Calculado automáticamente
    pendiente: detail.quantityPending,     // ← Calculado automáticamente
    completo: detail.isFullyReceived,      // ← Calculado automáticamente
  });
});
```

## 📋 Ejemplo de Respuesta JSON

```json
{
  "id": "uuid-orden",
  "status": "RECIBIDA_PARCIAL",
  "supplier": {
    "name": "Fertilizantes San Juan"
  },
  "details": [
    {
      "id": "uuid-detalle-1",
      "input": {
        "name": "Fertilizante NPK 15-15-15",
        "unit": "KG"
      },
      "quantity": 100,          // ← PEDIDO
      "quantityReceived": 60,   // ← RECIBIDO (suma automática)
      "quantityPending": 40,    // ← PENDIENTE (calculado)
      "isFullyReceived": false, // ← ESTADO
      "receiptDetails": [       // ← HISTORIAL DE RECEPCIONES
        {
          "quantityReceived": 30,
          "goodsReceipt": {
            "receivedAt": "2025-11-01"
          }
        },
        {
          "quantityReceived": 30,
          "goodsReceipt": {
            "receivedAt": "2025-11-05"
          }
        }
      ]
    }
  ]
}
```

## 🎨 Visualización Sugerida para Frontend

### Tabla de Detalles de Orden:

```
┌─────────────────────┬──────────┬──────────┬──────────┬──────────┬─────────┐
│ Insumo              │ Pedido   │ Recibido │ Pendiente│ Progreso │ Estado  │
├─────────────────────┼──────────┼──────────┼──────────┼──────────┼─────────┤
│ Fertilizante NPK    │ 100 KG   │ 60 KG    │ 40 KG    │ ▰▰▰▰▰▱▱  │ 60% ⚠️  │
│ Herbicida Glifosato │ 50 L     │ 50 L     │ 0 L      │ ▰▰▰▰▰▰▰  │ 100% ✅ │
│ Azufre Mojable      │ 100 KG   │ 0 KG     │ 100 KG   │ ▱▱▱▱▱▱▱  │ 0% 🔴   │
└─────────────────────┴──────────┴──────────┴──────────┴──────────┴─────────┘
```

### Componente React (ejemplo):

```tsx
function PurchaseOrderDetails({ orderId }) {
  const { data: order } = useQuery(['purchase-order', orderId], () =>
    api.get(`/purchase-orders/${orderId}`)
  );

  return (
    <table>
      <thead>
        <tr>
          <th>Insumo</th>
          <th>Pedido</th>
          <th>Recibido</th>
          <th>Pendiente</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {order.details.map(detail => (
          <tr key={detail.id}>
            <td>{detail.input.name}</td>
            <td>{detail.quantity} {detail.input.unit}</td>
            <td>{detail.quantityReceived} {detail.input.unit}</td>
            <td>{detail.quantityPending} {detail.input.unit}</td>
            <td>
              {detail.isFullyReceived ? (
                <Badge color="green">✅ Completo</Badge>
              ) : (
                <Badge color="yellow">⚠️ Pendiente</Badge>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## 🔄 Flujo de Recepciones

### 1. Crear Orden de Compra:
```bash
POST /api/purchase-orders
{
  "supplierId": "uuid",
  "details": [
    { "inputId": "uuid-fertilizante", "quantity": 100, "unitPrice": 850 }
  ]
}
```

### 2. Registrar Primera Recepción (Parcial):
```bash
POST /api/goods-receipts
{
  "purchaseOrderId": "uuid",
  "details": [
    { "purchaseOrderDetailId": "uuid-detalle", "quantityReceived": 60 }
  ]
}
```
→ Estado: `RECIBIDA_PARCIAL` (60/100)

### 3. Registrar Segunda Recepción:
```bash
POST /api/goods-receipts
{
  "purchaseOrderId": "uuid",
  "details": [
    { "purchaseOrderDetailId": "uuid-detalle", "quantityReceived": 40 }
  ]
}
```
→ Estado: `RECIBIDA` (100/100) ✅

## 📁 Archivos Creados/Actualizados

### ✅ Entidades Actualizadas:
- `src/entities/purchase-order-detail.entity.ts`
  - ✨ Agregados campos virtuales: `quantityReceived`, `quantityPending`, `isFullyReceived`
  - ✨ Relación con `receiptDetails`

- `src/entities/goods-receipt.entity.ts`
  - ✨ Agregada relación con `details`

### ⭐ Nuevas Entidades:
- `src/entities/goods-receipt-detail.entity.ts`
  - Nueva tabla para rastrear qué se recibió en cada remito

### 📝 DTOs:
- `src/dtos/goods-receipt.dto.ts` (ya existía y estaba correcto)
- `src/dtos/goods-receipt-detail.dto.ts` (nuevo, con validaciones adicionales)

### 📚 Documentación:
- `docs/GOODS_RECEIPT_TRACKING.md` (guía completa de implementación)

## 🚀 Próximos Pasos Sugeridos

1. **Crear migración de base de datos:**
   ```typescript
   // migration: CreateGoodsReceiptDetailsTable
   await queryRunner.createTable(new Table({
     name: 'goods_receipt_details',
     columns: [
       { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
       { name: 'goodsReceiptId', type: 'uuid' },
       { name: 'purchaseOrderDetailId', type: 'uuid' },
       { name: 'quantityReceived', type: 'decimal', precision: 10, scale: 2 },
       { name: 'notes', type: 'text', isNullable: true },
     ],
   }));
   ```

2. **Actualizar el controlador de GoodsReceipt:**
   - Implementar validación de cantidades
   - Actualizar automáticamente el estado de la orden
   - Actualizar el stock de insumos

3. **Crear endpoint de consulta optimizado:**
   ```typescript
   GET /api/purchase-orders/:id/pending-items
   // Devuelve solo los insumos con cantidades pendientes
   ```

4. **Actualizar el script de seed:**
   - Agregar `GoodsReceiptDetail` a los remitos existentes
   - Demostrar recepciones parciales

5. **Tests:**
   - Unitarios para los getters virtuales
   - Integración para el flujo completo de recepciones

## ⚠️ Consideraciones Importantes

1. **Validación de cantidades:** Asegúrate de que no se pueda recibir más de lo pedido
2. **Transacciones:** Usa transacciones al crear remitos que actualizan stock
3. **Auditoría:** Los campos `receivedAt` y `receivedBy` son cruciales para auditoría
4. **Soft deletes:** Las entidades tienen `deletedAt` para mantener historial

## 💡 Resumen

**SÍ, es totalmente posible** obtener las órdenes de compra con:
- ✅ Cantidad pedida de cada insumo
- ✅ Cantidad recibida de cada insumo (acumulada de todos los remitos)
- ✅ Cantidad pendiente de enviar
- ✅ Historial completo de recepciones
- ✅ Estado de completitud por insumo

La estructura está lista, solo falta:
1. Crear la tabla `goods_receipt_details` en la BD
2. Actualizar el controlador para usar los nuevos detalles
3. (Opcional) Migrar datos existentes si ya tienes remitos sin detalles
