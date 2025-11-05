# Script de Datos de Prueba - Recepciones Parciales

## 🎯 Objetivo

Este script demuestra el sistema completo de **seguimiento de recepciones parciales** de insumos en órdenes de compra.

## 📊 Escenarios Creados

### Escenario 1: OC-3 - Recepción Completa Simple ✅

**Orden de Compra:**
- Proveedor: Herramientas Agrícolas Norte
- Estado: `RECIBIDA`
- Items: 3 (Trampas, Tijeras, Rastrillos)

**Remito Único:**
```
Remito #1 (15/10/2025):
├─ Trampas: 200/200 (100%) ✅
├─ Tijeras: 25/25 (100%) ✅
└─ Rastrillos: 15/15 (100%) ✅
```

**Resultado:** Todo recibido en una sola entrega.

---

### Escenario 2: OC-4 - Recepciones Parciales Múltiples ⚠️

**Orden de Compra:**
- Proveedor: Sistemas de Riego Cuyo
- Estado: `RECIBIDA_PARCIAL`
- Items: 3 (Cintas, Goteros, Válvulas)

#### Remito #1 (20/10/2025) - Primera Entrega Parcial:
```
├─ Cintas de Riego: 30/50 (60%) ⚠️
├─ Goteros: 500/1000 (50%) ⚠️
└─ Válvulas: 0/20 (0%) 🔴
```
**Notas del Remito:** "Primera entrega parcial: cintas de riego y goteros. Faltan válvulas."

#### Remito #2 (25/10/2025) - Segunda Entrega Parcial:
```
├─ Cintas de Riego: +20 → 50/50 (100%) ✅
├─ Goteros: +500 → 1000/1000 (100%) ✅
└─ Válvulas: 0/20 (0%) 🔴
```
**Notas del Remito:** "Segunda entrega: completando cintas y goteros. Válvulas aún pendientes."

#### Estado Final:
```
OC-4: RECIBIDA_PARCIAL
├─ Cintas de Riego: 50/50 (100%) ✅ Completo
├─ Goteros: 1000/1000 (100%) ✅ Completo
└─ Válvulas: 0/20 (0%) 🔴 PENDIENTE
```

**Este es el caso de uso principal:** Demuestra cómo algunos items se completan antes que otros.

---

### Escenario 3: OC-5 - Recepción Completa ✅

**Orden de Compra:**
- Proveedor: Semillas y Plantines Los Andes
- Estado: `CERRADA`
- Items: 2 (Bolsas, Estacas)

**Remito Único:**
```
Remito #1 (28/10/2025):
├─ Bolsas: 500/500 (100%) ✅
└─ Estacas: 300/300 (100%) ✅
```

**Resultado:** Todo recibido y orden cerrada.

---

## 🔍 Queries de Ejemplo

### 1. Ver Detalle Completo de OC-4 (con recepciones parciales)

```typescript
const order = await purchaseOrderRepo.findOne({
  where: { id: 'oc-4-id' },
  relations: [
    'supplier',
    'details',
    'details.input',
    'details.receiptDetails',
    'details.receiptDetails.goodsReceipt',
    'receipts',
    'receipts.details',
  ],
});

// Resultado esperado:
order.details.forEach(detail => {
  console.log(`
    ${detail.input.name}:
    - Pedido: ${detail.quantity}
    - Recibido: ${detail.quantityReceived} (${detail.quantityReceived / detail.quantity * 100}%)
    - Pendiente: ${detail.quantityPending}
    - Estado: ${detail.isFullyReceived ? 'Completo' : 'Pendiente'}
    
    Historial de recepciones:
    ${detail.receiptDetails.map(rd => `
      - ${rd.goodsReceipt.receivedAt}: ${rd.quantityReceived} unidades
        Nota: ${rd.notes}
    `).join('\n')}
  `);
});
```

### Salida Esperada para "Válvulas":

```
Válvula Solenoide 1":
- Pedido: 20
- Recibido: 0 (0%)
- Pendiente: 20
- Estado: Pendiente

Historial de recepciones:
  (vacío - nunca se recibieron)
```

### Salida Esperada para "Cintas de Riego":

```
Cinta de Riego por Goteo:
- Pedido: 50
- Recibido: 50 (100%)
- Pendiente: 0
- Estado: Completo

Historial de recepciones:
  - 2025-10-20: 30 unidades
    Nota: Primera entrega parcial de cintas. Pendiente: 20 unidades
  - 2025-10-25: 20 unidades
    Nota: Completado: recibidas 20 cintas finales (50/50 total)
```

---

## 📊 Estructura de Datos Creada

### Tabla: `purchase_orders`
```
| id    | supplierId | status            | totalAmount |
|-------|------------|-------------------|-------------|
| OC-3  | Herr. Agr. | RECIBIDA         | 171,000     |
| OC-4  | Riego Cuyo | RECIBIDA_PARCIAL | 730,000     |
| OC-5  | Semillas   | CERRADA          | 309,500     |
```

### Tabla: `purchase_order_details`
```
| id       | purchaseOrderId | inputId  | quantity | unitPrice |
|----------|-----------------|----------|----------|-----------|
| POD-001  | OC-3           | Trampas  | 200      | 125.00    |
| POD-002  | OC-3           | Tijeras  | 25       | 4500.00   |
| POD-003  | OC-3           | Rastrill | 15       | 2300.00   |
| POD-004  | OC-4           | Cintas   | 50       | 8900.00   |
| POD-005  | OC-4           | Goteros  | 1000     | 35.00     |
| POD-006  | OC-4           | Válvulas | 20       | 12500.00  |
| POD-007  | OC-5           | Bolsas   | 500      | 85.00     |
| POD-008  | OC-5           | Estacas  | 300      | 890.00    |
```

### Tabla: `goods_receipts`
```
| id   | purchaseOrderId | receivedAt  | notes                          |
|------|-----------------|-------------|--------------------------------|
| GR-1 | OC-3           | 2025-10-15  | Recepción completa...          |
| GR-2 | OC-4           | 2025-10-20  | Primera entrega parcial...     |
| GR-3 | OC-4           | 2025-10-25  | Segunda entrega...             |
| GR-4 | OC-5           | 2025-10-28  | Recepción completa...          |
```

### Tabla: `goods_receipt_details` ⭐ NUEVA
```
| id       | goodsReceiptId | purchaseOrderDetailId | quantityReceived | notes                    |
|----------|----------------|----------------------|------------------|--------------------------|
| GRD-001  | GR-1          | POD-001              | 200              | Recepción completa...    |
| GRD-002  | GR-1          | POD-002              | 25               | Recepción completa...    |
| GRD-003  | GR-1          | POD-003              | 15               | Recepción completa...    |
| GRD-004  | GR-2          | POD-004              | 30               | Primera entrega parcial  |
| GRD-005  | GR-2          | POD-005              | 500              | Primera entrega parcial  |
| GRD-006  | GR-3          | POD-004              | 20               | Completado: 50/50        |
| GRD-007  | GR-3          | POD-005              | 500              | Completado: 1000/1000    |
| GRD-008  | GR-4          | POD-007              | 500              | Recepción completa...    |
| GRD-009  | GR-4          | POD-008              | 300              | Recepción completa...    |
```

**Nota:** Observa que POD-006 (Válvulas) NO tiene ningún registro en `goods_receipt_details`, lo que indica que nunca se recibieron (0/20).

---

## 🎨 Visualización Recomendada en Frontend

### Vista de Lista de Órdenes

```
┌────────┬───────────────────────┬──────────────────┬────────────┐
│ Orden  │ Proveedor             │ Estado           │ Progreso   │
├────────┼───────────────────────┼──────────────────┼────────────┤
│ OC-3   │ Herramientas Norte    │ ✅ Recibida      │ ▰▰▰▰▰▰▰ 100%│
│ OC-4   │ Sistemas de Riego     │ ⚠️ Parcial       │ ▰▰▰▰▰▱▱ 67%│
│ OC-5   │ Semillas Los Andes    │ ✅ Cerrada       │ ▰▰▰▰▰▰▰ 100%│
└────────┴───────────────────────┴──────────────────┴────────────┘
```

### Vista Detalle de OC-4

```
┌─────────────────────────────────────────────────────────────────┐
│ Orden de Compra #OC-4                                           │
│ Proveedor: Sistemas de Riego Cuyo                               │
│ Estado: RECIBIDA_PARCIAL                                        │
├─────────────────────────────────────────────────────────────────┤
│ DETALLES DE INSUMOS                                             │
├───────────────────┬─────────┬──────────┬──────────┬────────────┤
│ Producto          │ Pedido  │ Recibido │ Pendiente│ Estado     │
├───────────────────┼─────────┼──────────┼──────────┼────────────┤
│ Cinta Riego       │ 50 ud   │ 50 ud    │ 0 ud     │ ✅ 100%    │
│ Goteros Auto.     │ 1000 ud │ 1000 ud  │ 0 ud     │ ✅ 100%    │
│ Válvula Sole. 1"  │ 20 ud   │ 0 ud     │ 20 ud    │ 🔴 0%      │
└───────────────────┴─────────┴──────────┴──────────┴────────────┘

HISTORIAL DE RECEPCIONES

📄 Remito #1 - 20/10/2025 10:00
   Recibido por: Admin Sistema
   Nota: "Primera entrega parcial: cintas y goteros. Faltan válvulas."
   Items recibidos:
   • Cinta de Riego: 30 unidades
   • Goteros: 500 unidades

📄 Remito #2 - 25/10/2025 09:15
   Recibido por: Admin Sistema
   Nota: "Segunda entrega: completando cintas y goteros."
   Items recibidos:
   • Cinta de Riego: 20 unidades (completado)
   • Goteros: 500 unidades (completado)

⚠️ PENDIENTE: Válvulas Solenoide 1" (20 unidades)
```

---

## 🧪 Tests Recomendados

### Test 1: Verificar Cálculos Automáticos
```typescript
test('debe calcular correctamente quantityReceived', async () => {
  const detail = await purchaseOrderDetailRepo.findOne({
    where: { input: { name: 'Cinta de Riego por Goteo' } },
    relations: ['receiptDetails'],
  });
  
  expect(detail.quantity).toBe(50); // Pedido
  expect(detail.quantityReceived).toBe(50); // 30 + 20 = 50
  expect(detail.quantityPending).toBe(0);
  expect(detail.isFullyReceived).toBe(true);
});

test('debe calcular correctamente items sin recepciones', async () => {
  const detail = await purchaseOrderDetailRepo.findOne({
    where: { input: { name: 'Válvula Solenoide' } },
    relations: ['receiptDetails'],
  });
  
  expect(detail.quantity).toBe(20); // Pedido
  expect(detail.quantityReceived).toBe(0); // Nada recibido
  expect(detail.quantityPending).toBe(20);
  expect(detail.isFullyReceived).toBe(false);
});
```

### Test 2: Validar que no se pueda exceder cantidad pedida
```typescript
test('debe rechazar recepción que excede cantidad pedida', async () => {
  const detail = await purchaseOrderDetailRepo.findOne({
    where: { input: { name: 'Válvula Solenoide' } },
    relations: ['receiptDetails'],
  });
  
  // Intentar recibir 25 cuando solo se pidieron 20
  await expect(
    createGoodsReceipt({
      purchaseOrderId: detail.purchaseOrderId,
      details: [{ 
        purchaseOrderDetailId: detail.id, 
        quantityReceived: 25 
      }]
    })
  ).rejects.toThrow('No se puede recibir 25');
});
```

---

## 🚀 Endpoints Sugeridos

```typescript
// GET /api/purchase-orders/:id/tracking
// → Devuelve orden completa con cantidades y porcentajes

// GET /api/purchase-orders/:id/pending
// → Devuelve solo items con cantidad pendiente > 0

// GET /api/purchase-orders/with-pending
// → Lista todas las órdenes que tienen items pendientes

// POST /api/goods-receipts
// → Crear nuevo remito con validaciones automáticas

// GET /api/reports/pending-by-supplier
// → Reporte de pendientes agrupados por proveedor
```

---

## 📝 Notas de Implementación

1. **Campos Calculados:** Los getters `quantityReceived`, `quantityPending`, e `isFullyReceived` se calculan automáticamente al cargar las relaciones.

2. **Actualización de Stock:** El stock se actualiza en cada remito individual, no al final.

3. **Estados de Orden:** 
   - `APROBADA` → primera recepción → `RECIBIDA_PARCIAL`
   - `RECIBIDA_PARCIAL` → última recepción completa → `RECIBIDA`

4. **Validaciones:** El script NO valida duplicados ni excesos (es datos de prueba). El controlador real DEBE validar.

---

## ✅ Ventajas del Nuevo Sistema

1. ✅ **Trazabilidad completa**: Sabes exactamente cuándo y cuánto se recibió
2. ✅ **Recepciones parciales**: Múltiples remitos para la misma orden
3. ✅ **Cálculos automáticos**: No necesitas consultas SQL complejas
4. ✅ **Por insumo**: Cada producto tiene su propio tracking
5. ✅ **Historial**: Auditoría completa de todas las entregas
6. ✅ **Validable**: Puedes verificar que no se reciba más de lo pedido
