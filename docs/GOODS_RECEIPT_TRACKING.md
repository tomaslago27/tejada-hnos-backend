# Sistema de Seguimiento de Recepciones de Compras

## 📋 Resumen

Este documento describe cómo el sistema rastrea las cantidades recibidas vs. pendientes de cada insumo en las órdenes de compra.

## 🏗️ Estructura de Entidades

### Diagrama de Relaciones

```
PurchaseOrder (Orden de Compra)
├── id: uuid
├── status: string (PENDIENTE, APROBADA, RECIBIDA, etc.)
├── totalAmount: decimal
├── supplierId: uuid
│
├── details: PurchaseOrderDetail[] ← QUÉ SE PIDIÓ
│   ├── id: uuid
│   ├── inputId: uuid
│   ├── quantity: decimal ← CANTIDAD PEDIDA
│   ├── unitPrice: decimal
│   │
│   ├── receiptDetails: GoodsReceiptDetail[] ← QUÉ SE RECIBIÓ
│   │   └── quantityReceived: decimal
│   │
│   └── [Campos virtuales calculados]
│       ├── quantityReceived: number ← SUMA de todos los receiptDetails
│       ├── quantityPending: number ← quantity - quantityReceived
│       └── isFullyReceived: boolean
│
└── receipts: GoodsReceipt[] ← REMITOS DE RECEPCIÓN
    ├── id: uuid
    ├── receivedAt: date
    ├── receivedById: uuid
    ├── notes: string
    │
    └── details: GoodsReceiptDetail[]
        ├── id: uuid
        ├── purchaseOrderDetailId: uuid
        ├── quantityReceived: decimal
        └── notes: string
```

## 🎯 ¿Cómo Funciona?

### 1. Se crea una Orden de Compra

```typescript
const purchaseOrder = {
  supplierId: "uuid-proveedor",
  status: "PENDIENTE",
  totalAmount: 5000,
  details: [
    {
      inputId: "uuid-fertilizante",
      quantity: 100,      // ← Se pidieron 100 kg
      unitPrice: 50
    },
    {
      inputId: "uuid-herbicida",
      quantity: 50,       // ← Se pidieron 50 litros
      unitPrice: 80
    }
  ]
};
```

### 2. Llega una recepción PARCIAL (Remito 1)

```typescript
const goodsReceipt1 = {
  purchaseOrderId: "uuid-orden",
  receivedById: "uuid-admin",
  receivedAt: "2025-11-01",
  notes: "Primera entrega del proveedor",
  details: [
    {
      purchaseOrderDetailId: "uuid-detalle-fertilizante",
      quantityReceived: 60,   // ← Llegaron solo 60 kg de 100
      notes: "Faltan 40 kg"
    },
    {
      purchaseOrderDetailId: "uuid-detalle-herbicida",
      quantityReceived: 50,   // ← Llegaron los 50 litros completos
      notes: "Completo"
    }
  ]
};
```

**Estado después del Remito 1:**
- Fertilizante: 60/100 recibidos → **40 pendientes** ⚠️
- Herbicida: 50/50 recibidos → **0 pendientes** ✅

### 3. Llega una segunda recepción (Remito 2)

```typescript
const goodsReceipt2 = {
  purchaseOrderId: "uuid-orden",
  receivedById: "uuid-admin",
  receivedAt: "2025-11-05",
  notes: "Segunda entrega - completando fertilizante",
  details: [
    {
      purchaseOrderDetailId: "uuid-detalle-fertilizante",
      quantityReceived: 40,   // ← Llegaron los 40 kg faltantes
      notes: "Entrega completada"
    }
  ]
};
```

**Estado después del Remito 2:**
- Fertilizante: 100/100 recibidos → **0 pendientes** ✅
- Herbicida: 50/50 recibidos → **0 pendientes** ✅

**Orden de Compra:** `RECIBIDA` (todo completo)

## 💻 Ejemplo de Consulta con TypeORM

### Obtener una Orden de Compra con todo el detalle

```typescript
const purchaseOrderRepo = dataSource.getRepository(PurchaseOrder);

const order = await purchaseOrderRepo.findOne({
  where: { id: orderId },
  relations: [
    'supplier',
    'details',
    'details.input',
    'details.receiptDetails',
    'receipts',
    'receipts.receivedBy',
    'receipts.details',
  ],
});

// Analizar cada detalle
order.details.forEach(detail => {
  console.log(`
    Insumo: ${detail.input.name}
    Pedido: ${detail.quantity} ${detail.input.unit}
    Recibido: ${detail.quantityReceived} ${detail.input.unit}
    Pendiente: ${detail.quantityPending} ${detail.input.unit}
    Estado: ${detail.isFullyReceived ? '✅ Completo' : '⚠️ Pendiente'}
  `);
  
  // Ver historial de recepciones
  detail.receiptDetails.forEach(receipt => {
    console.log(`  - Remito: ${receipt.quantityReceived} ${detail.input.unit}`);
  });
});
```

### Ejemplo de Response JSON

```json
{
  "id": "uuid-orden",
  "status": "RECIBIDA_PARCIAL",
  "totalAmount": 9000,
  "supplier": {
    "id": "uuid-proveedor",
    "name": "Fertilizantes San Juan"
  },
  "details": [
    {
      "id": "uuid-detalle-1",
      "input": {
        "id": "uuid-fertilizante",
        "name": "Fertilizante NPK 15-15-15",
        "unit": "KG"
      },
      "quantity": 100,
      "unitPrice": 50,
      "quantityReceived": 60,
      "quantityPending": 40,
      "isFullyReceived": false,
      "receiptDetails": [
        {
          "id": "uuid-receipt-detail-1",
          "quantityReceived": 60,
          "notes": "Primera entrega parcial",
          "goodsReceipt": {
            "receivedAt": "2025-11-01T10:00:00Z",
            "receivedBy": {
              "name": "Admin",
              "lastName": "Sistema"
            }
          }
        }
      ]
    },
    {
      "id": "uuid-detalle-2",
      "input": {
        "id": "uuid-herbicida",
        "name": "Herbicida Glifosato 48%",
        "unit": "LITRO"
      },
      "quantity": 50,
      "unitPrice": 80,
      "quantityReceived": 50,
      "quantityPending": 0,
      "isFullyReceived": true,
      "receiptDetails": [
        {
          "id": "uuid-receipt-detail-2",
          "quantityReceived": 50,
          "notes": "Recepción completa",
          "goodsReceipt": {
            "receivedAt": "2025-11-01T10:00:00Z",
            "receivedBy": {
              "name": "Admin",
              "lastName": "Sistema"
            }
          }
        }
      ]
    }
  ],
  "receipts": [
    {
      "id": "uuid-remito-1",
      "receivedAt": "2025-11-01T10:00:00Z",
      "notes": "Primera entrega del proveedor",
      "receivedBy": {
        "name": "Admin",
        "lastName": "Sistema"
      },
      "details": [
        {
          "purchaseOrderDetailId": "uuid-detalle-1",
          "quantityReceived": 60,
          "notes": "Faltan 40 kg"
        },
        {
          "purchaseOrderDetailId": "uuid-detalle-2",
          "quantityReceived": 50,
          "notes": "Completo"
        }
      ]
    }
  ]
}
```

## 🎨 Ejemplo de Visualización en Frontend

### Vista de Orden de Compra

```
┌─────────────────────────────────────────────────────────────┐
│ Orden de Compra #OC-001                                     │
│ Proveedor: Fertilizantes San Juan                           │
│ Estado: RECIBIDA_PARCIAL                                    │
├─────────────────────────────────────────────────────────────┤
│ INSUMOS                                                      │
├──────────────────┬─────────┬──────────┬──────────┬─────────┤
│ Producto         │ Pedido  │ Recibido │ Pendiente│ Estado  │
├──────────────────┼─────────┼──────────┼──────────┼─────────┤
│ Fertilizante NPK │ 100 KG  │ 60 KG    │ 40 KG    │ ⚠️ 60%  │
│ Herbicida Glifo  │ 50 L    │ 50 L     │ 0 L      │ ✅ 100% │
└──────────────────┴─────────┴──────────┴──────────┴─────────┘

HISTORIAL DE RECEPCIONES:
┌────────────┬─────────────────┬──────────────────────────────┐
│ Fecha      │ Recibido por    │ Insumos                      │
├────────────┼─────────────────┼──────────────────────────────┤
│ 01/11/2025 │ Admin Sistema   │ • Fertilizante NPK: 60 KG    │
│            │                 │ • Herbicida Glifosato: 50 L  │
└────────────┴─────────────────┴──────────────────────────────┘
```

## 🔄 Flujo de Estados

```
PENDIENTE → (se aprueba) → APROBADA
    ↓
(llega remito parcial) → RECIBIDA_PARCIAL
    ↓
(llega remito final) → RECIBIDA
    ↓
(se cierra) → CERRADA
```

## 🚀 Implementación en el Controlador

### Endpoint: GET /api/purchase-orders/:id

```typescript
async getPurchaseOrderDetail(req: Request, res: Response) {
  const { id } = req.params;
  
  const order = await this.purchaseOrderRepo.findOne({
    where: { id },
    relations: [
      'supplier',
      'details',
      'details.input',
      'details.receiptDetails',
      'details.receiptDetails.goodsReceipt',
      'details.receiptDetails.goodsReceipt.receivedBy',
      'receipts',
      'receipts.receivedBy',
      'receipts.details',
    ],
  });

  if (!order) {
    return res.status(404).json({ message: 'Orden no encontrada' });
  }

  // Transformar para incluir campos virtuales
  const response = {
    ...order,
    details: order.details.map(detail => ({
      ...detail,
      quantityReceived: detail.quantityReceived, // getter
      quantityPending: detail.quantityPending,   // getter
      isFullyReceived: detail.isFullyReceived,   // getter
    })),
  };

  return res.json(response);
}
```

### Endpoint: POST /api/goods-receipts

```typescript
async createGoodsReceipt(req: Request, res: Response) {
  const { purchaseOrderId, receivedById, notes, details } = req.body;

  // Validar que las cantidades no excedan lo pendiente
  const order = await this.purchaseOrderRepo.findOne({
    where: { id: purchaseOrderId },
    relations: ['details', 'details.receiptDetails'],
  });

  for (const detail of details) {
    const orderDetail = order.details.find(
      d => d.id === detail.purchaseOrderDetailId
    );
    
    if (!orderDetail) {
      return res.status(400).json({
        message: `Detalle de orden ${detail.purchaseOrderDetailId} no encontrado`,
      });
    }

    const pendiente = orderDetail.quantityPending;
    if (detail.quantityReceived > pendiente) {
      return res.status(400).json({
        message: `No se puede recibir ${detail.quantityReceived} de ${orderDetail.input.name}. Solo quedan ${pendiente} pendientes.`,
      });
    }
  }

  // Crear el remito
  const receipt = this.goodsReceiptRepo.create({
    purchaseOrderId,
    receivedById,
    notes,
    details,
  });

  await this.goodsReceiptRepo.save(receipt);

  // Actualizar estado de la orden
  const allReceived = order.details.every(d => d.isFullyReceived);
  if (allReceived) {
    order.status = 'RECIBIDA';
  } else {
    order.status = 'RECIBIDA_PARCIAL';
  }
  await this.purchaseOrderRepo.save(order);

  return res.status(201).json(receipt);
}
```

## 📊 Queries Útiles

### Obtener órdenes con insumos pendientes

```typescript
const ordersWithPending = await purchaseOrderRepo
  .createQueryBuilder('po')
  .leftJoinAndSelect('po.details', 'detail')
  .leftJoinAndSelect('detail.input', 'input')
  .leftJoinAndSelect('detail.receiptDetails', 'receiptDetail')
  .where('po.status IN (:...statuses)', {
    statuses: ['APROBADA', 'RECIBIDA_PARCIAL'],
  })
  .getMany();

// Filtrar solo los que tienen cantidades pendientes
const filtered = ordersWithPending.filter(order =>
  order.details.some(detail => detail.quantityPending > 0)
);
```

### Reporte de insumos pendientes por proveedor

```typescript
const pendingBySupplier = await purchaseOrderRepo
  .createQueryBuilder('po')
  .leftJoinAndSelect('po.supplier', 'supplier')
  .leftJoinAndSelect('po.details', 'detail')
  .leftJoinAndSelect('detail.input', 'input')
  .leftJoinAndSelect('detail.receiptDetails', 'receiptDetail')
  .where('po.status IN (:...statuses)', {
    statuses: ['APROBADA', 'RECIBIDA_PARCIAL'],
  })
  .getMany();

// Agrupar por proveedor
const report = pendingBySupplier.reduce((acc, order) => {
  const supplierName = order.supplier.name;
  if (!acc[supplierName]) {
    acc[supplierName] = [];
  }
  
  order.details.forEach(detail => {
    if (detail.quantityPending > 0) {
      acc[supplierName].push({
        input: detail.input.name,
        pending: detail.quantityPending,
        unit: detail.input.unit,
        orderId: order.id,
      });
    }
  });
  
  return acc;
}, {});
```

## 🔧 Migración de Datos Existentes

Si ya tienes órdenes de compra sin detalles de recepción, deberás crear una migración o script que:

1. Por cada `GoodsReceipt` existente sin `details`
2. Buscar su `PurchaseOrder` y sus `details`
3. Crear `GoodsReceiptDetail` para cada detalle de la orden
4. Asumir que se recibió la cantidad completa (o pedir input manual)

## ✅ Ventajas de este Sistema

1. **Trazabilidad completa**: Sabes exactamente cuándo y cuánto de cada insumo fue recibido
2. **Soporte para recepciones parciales**: Múltiples remitos para una misma orden
3. **Cálculos automáticos**: Los getters calculan automáticamente pendientes
4. **Validación**: Se puede validar que no se reciba más de lo pedido
5. **Reportes**: Fácil generar reportes de pendientes por proveedor/insumo
6. **Auditoría**: Historial completo de todas las recepciones

## 🎯 Próximos Pasos

1. Crear la migración para la tabla `goods_receipt_details`
2. Actualizar el controlador de `GoodsReceipt` para soportar detalles
3. Crear los DTOs de validación
4. Actualizar el seed script para crear datos de ejemplo
5. Implementar endpoints de consulta con los cálculos
6. Crear tests unitarios para los getters virtuales
