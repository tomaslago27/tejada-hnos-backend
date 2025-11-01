# Test Manual - Filtrado de Clientes por Total Gastado

## Preparación de Datos de Prueba

### 1. Crear Clientes de Prueba

```http
### Cliente 1: VIP (gastará mucho)
POST http://localhost:3000/customers
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "name": "Supermercado VIP",
  "taxId": "20-11111111-1",
  "address": "Av. Principal 100",
  "contactEmail": "vip@super.com",
  "phoneNumber": "+54 11 1111-1111"
}

### Cliente 2: Regular (gasto medio)
POST http://localhost:3000/customers
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "name": "Mayorista Regular",
  "taxId": "20-22222222-2",
  "address": "Calle Comercio 200",
  "contactEmail": "regular@mayorista.com",
  "phoneNumber": "+54 11 2222-2222"
}

### Cliente 3: Pequeño (poco gasto)
POST http://localhost:3000/customers
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "name": "Almacén Pequeño",
  "taxId": "20-33333333-3",
  "address": "Barrio Sur 300",
  "contactEmail": "pequeno@almacen.com",
  "phoneNumber": "+54 11 3333-3333"
}
```

### 2. Crear Órdenes de Venta

```http
### Orden para Cliente VIP - $150,000
POST http://localhost:3000/sales-orders
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "customerId": "{{vip_customer_id}}",
  "status": "COMPLETADA",
  "details": [
    {
      "caliber": "Grande",
      "variety": "Thompson",
      "unitPrice": 500,
      "quantityKg": 200
    },
    {
      "caliber": "Mediano",
      "variety": "Red Globe",
      "unitPrice": 400,
      "quantityKg": 125
    }
  ]
}

### Orden 2 para Cliente VIP - $50,000
POST http://localhost:3000/sales-orders
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "customerId": "{{vip_customer_id}}",
  "status": "COMPLETADA",
  "details": [
    {
      "caliber": "Grande",
      "variety": "Thompson",
      "unitPrice": 500,
      "quantityKg": 100
    }
  ]
}

### Orden para Cliente Regular - $40,000
POST http://localhost:3000/sales-orders
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "customerId": "{{regular_customer_id}}",
  "status": "COMPLETADA",
  "details": [
    {
      "caliber": "Mediano",
      "variety": "Thompson",
      "unitPrice": 400,
      "quantityKg": 100
    }
  ]
}

### Orden para Cliente Pequeño - $5,000
POST http://localhost:3000/sales-orders
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "customerId": "{{small_customer_id}}",
  "status": "COMPLETADA",
  "details": [
    {
      "caliber": "Pequeño",
      "variety": "Thompson",
      "unitPrice": 250,
      "quantityKg": 20
    }
  ]
}
```

**Resumen de Totales Esperados:**
- Cliente VIP: $200,000 (100,000 + 50,000 + 50,000)
- Cliente Regular: $40,000
- Cliente Pequeño: $5,000

## Tests de Filtrado

### Test 1: Obtener TODOS los clientes (sin filtros)

```http
GET http://localhost:3000/customers
Authorization: Bearer {{admin_token}}
```

**Resultado Esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Supermercado VIP",
      "totalSpent": 200000,
      "totalOrders": 2,
      "salesOrders": [...]
    },
    {
      "id": "...",
      "name": "Mayorista Regular",
      "totalSpent": 40000,
      "totalOrders": 1,
      "salesOrders": [...]
    },
    {
      "id": "...",
      "name": "Almacén Pequeño",
      "totalSpent": 5000,
      "totalOrders": 1,
      "salesOrders": [...]
    }
  ]
}
```

### Test 2: Clientes VIP (más de $100,000)

```http
GET http://localhost:3000/customers?minTotalPurchases=100000
Authorization: Bearer {{admin_token}}
```

**Resultado Esperado:** Solo "Supermercado VIP"

### Test 3: Clientes Pequeños (menos de $10,000)

```http
GET http://localhost:3000/customers?maxTotalPurchases=10000
Authorization: Bearer {{admin_token}}
```

**Resultado Esperado:** Solo "Almacén Pequeño"

### Test 4: Clientes Regulares (rango $20,000 - $80,000)

```http
GET http://localhost:3000/customers?minTotalPurchases=20000&maxTotalPurchases=80000
Authorization: Bearer {{admin_token}}
```

**Resultado Esperado:** Solo "Mayorista Regular"

### Test 5: Búsqueda por nombre + filtro de total

```http
GET http://localhost:3000/customers?searchTerm=super&minTotalPurchases=50000
Authorization: Bearer {{admin_token}}
```

**Resultado Esperado:** Solo "Supermercado VIP" (cumple nombre y total)

### Test 6: Clientes con más de $0 (todos con órdenes)

```http
GET http://localhost:3000/customers?minTotalPurchases=1
Authorization: Bearer {{admin_token}}
```

**Resultado Esperado:** Los 3 clientes

### Test 7: Búsqueda por nombre sin filtro de total

```http
GET http://localhost:3000/customers?searchTerm=mayorista
Authorization: Bearer {{admin_token}}
```

**Resultado Esperado:** Solo "Mayorista Regular"

### Test 8: Combinación múltiple

```http
GET http://localhost:3000/customers?searchTerm=a&minTotalPurchases=1&maxTotalPurchases=50000
Authorization: Bearer {{admin_token}}
```

**Resultado Esperado:** "Mayorista Regular" y "Almacén Pequeño" (ambos tienen "a" y están en rango)

## Tests de Autorización

### Test 9: Como CAPATAZ (puede leer)

```http
GET http://localhost:3000/customers?minTotalPurchases=50000
Authorization: Bearer {{capataz_token}}
```

**Resultado Esperado:** ✅ 200 OK - Solo "Supermercado VIP"

### Test 10: Como OPERARIO (no puede leer)

```http
GET http://localhost:3000/customers
Authorization: Bearer {{operario_token}}
```

**Resultado Esperado:** ❌ 403 Forbidden

## Validación de Cálculos

### Cliente VIP - Desglose:

**Orden 1:**
- Detalle 1: 500 × 200kg = $100,000
- Detalle 2: 400 × 125kg = $50,000
- **Subtotal Orden 1: $150,000**

**Orden 2:**
- Detalle 1: 500 × 100kg = $50,000
- **Subtotal Orden 2: $50,000**

**Total Cliente VIP: $200,000** ✅

### Cliente Regular - Desglose:

**Orden 1:**
- Detalle 1: 400 × 100kg = $40,000
- **Total Cliente Regular: $40,000** ✅

### Cliente Pequeño - Desglose:

**Orden 1:**
- Detalle 1: 250 × 20kg = $5,000
- **Total Cliente Pequeño: $5,000** ✅

## Tests Edge Cases

### Test 11: Cliente sin órdenes

```http
POST http://localhost:3000/customers
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "name": "Cliente Sin Órdenes",
  "taxId": "20-44444444-4"
}

###
GET http://localhost:3000/customers?minTotalPurchases=0
Authorization: Bearer {{admin_token}}
```

**Resultado Esperado:** Debe aparecer con `totalSpent: 0`

### Test 12: Filtro con valor 0

```http
GET http://localhost:3000/customers?minTotalPurchases=0&maxTotalPurchases=0
Authorization: Bearer {{admin_token}}
```

**Resultado Esperado:** Solo clientes con totalSpent === 0

### Test 13: Rango imposible

```http
GET http://localhost:3000/customers?minTotalPurchases=100000&maxTotalPurchases=50000
Authorization: Bearer {{admin_token}}
```

**Resultado Esperado:** Array vacío `[]`

### Test 14: Valores negativos

```http
GET http://localhost:3000/customers?minTotalPurchases=-1000
Authorization: Bearer {{admin_token}}
```

**Resultado Esperado:** Todos los clientes (ninguno tiene total negativo)

## Verificación Manual con SQL

Si quieres verificar los cálculos directamente en la base de datos:

```sql
-- Ver todos los clientes con su total gastado
SELECT 
  c.id,
  c.name,
  COUNT(DISTINCT so.id) as total_orders,
  COALESCE(SUM(sod.unit_price * sod.quantity_kg), 0) as total_spent
FROM customers c
LEFT JOIN sales_orders so ON so.customer_id = c.id
LEFT JOIN sales_order_details sod ON sod.sales_order_id = so.id
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.name
ORDER BY total_spent DESC;

-- Ver detalles de un cliente específico
SELECT 
  c.name as cliente,
  so.id as orden_id,
  so.status,
  sod.caliber,
  sod.variety,
  sod.unit_price,
  sod.quantity_kg,
  (sod.unit_price * sod.quantity_kg) as subtotal
FROM customers c
LEFT JOIN sales_orders so ON so.customer_id = c.id
LEFT JOIN sales_order_details sod ON sod.sales_order_id = so.id
WHERE c.name = 'Supermercado VIP'
ORDER BY so.created_at;
```

## Resultado Esperado Final

Después de ejecutar todos los tests, deberías ver:

1. ✅ El filtrado por rango funciona correctamente
2. ✅ La búsqueda por nombre se combina con filtros numéricos
3. ✅ Los cálculos de totalSpent son precisos
4. ✅ La autorización funciona (ADMIN/CAPATAZ sí, OPERARIO no)
5. ✅ Los clientes sin órdenes muestran totalSpent = 0
6. ✅ Las relaciones (salesOrders y details) se cargan correctamente

## Troubleshooting

### Si `totalSpent` es siempre 0:

1. Verificar que las SalesOrders tengan `customerId` correcto
2. Verificar que los SalesOrderDetails tengan `salesOrderId` correcto
3. Verificar que `unitPrice` y `quantityKg` no sean null/undefined
4. Revisar el log SQL en el backend con `logging: true` en TypeORM

### Si los filtros no funcionan:

1. Verificar que los query params se pasen como números
2. Revisar la consola del navegador/Postman
3. Agregar logs en el servicio para ver los valores recibidos
4. Probar con valores hardcodeados primero
