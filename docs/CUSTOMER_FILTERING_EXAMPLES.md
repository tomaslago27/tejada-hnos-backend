# Filtrado y Cálculo de Total Gastado por Cliente

## 📊 Cómo funciona

El endpoint `GET /customers` ahora calcula automáticamente el **total gastado** por cada cliente sumando todas sus órdenes de venta:

```
Total Gastado = Σ (unitPrice × quantityKg) de todos los SalesOrderDetails
```

La estructura de datos es:
```
Customer → SalesOrder → SalesOrderDetail (unitPrice, quantityKg)
```

## 🔍 Filtros Disponibles

### 1. **Búsqueda por Nombre**
Filtra clientes cuyo nombre contenga el término de búsqueda (case-insensitive).

```bash
GET /customers?searchTerm=super
```

### 2. **Total Mínimo Gastado**
Filtra clientes que hayan gastado al menos la cantidad especificada.

```bash
GET /customers?minTotalPurchases=10000
```

### 3. **Total Máximo Gastado**
Filtra clientes que hayan gastado como máximo la cantidad especificada.

```bash
GET /customers?maxTotalPurchases=50000
```

### 4. **Rango de Total Gastado**
Combina mínimo y máximo para obtener clientes dentro de un rango.

```bash
GET /customers?minTotalPurchases=10000&maxTotalPurchases=50000
```

### 5. **Incluir Clientes Eliminados**
Incluye clientes que han sido eliminados (soft delete).

```bash
GET /customers?withDeleted=true
```

### 6. **Combinación de Filtros**
Puedes combinar múltiples filtros:

```bash
GET /customers?searchTerm=super&minTotalPurchases=10000&maxTotalPurchases=100000
```

## 📝 Ejemplos de Uso

### Ejemplo 1: Obtener Top Clientes (más de $100,000)

```bash
curl -X GET "http://localhost:3000/customers?minTotalPurchases=100000" \
  -H "Authorization: Bearer {token}"
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "name": "Supermercado Central",
      "taxId": "20-12345678-9",
      "address": "Av. Principal 123",
      "contactEmail": "ventas@supercentral.com",
      "phoneNumber": "+54 11 1234-5678",
      "totalSpent": 150000.50,
      "totalOrders": 12,
      "salesOrders": [
        {
          "id": "order-1",
          "status": "COMPLETADA",
          "details": [
            {
              "id": "detail-1",
              "caliber": "Grande",
              "variety": "Thompson",
              "unitPrice": 500.00,
              "quantityKg": 100.00
            }
          ]
        }
      ],
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-10-30T14:30:00.000Z",
      "deletedAt": null
    }
  ]
}
```

### Ejemplo 2: Buscar Clientes Pequeños ($0 - $10,000)

```bash
curl -X GET "http://localhost:3000/customers?maxTotalPurchases=10000" \
  -H "Authorization: Bearer {token}"
```

### Ejemplo 3: Buscar Clientes por Nombre en Rango

```bash
curl -X GET "http://localhost:3000/customers?searchTerm=mayorista&minTotalPurchases=20000&maxTotalPurchases=80000" \
  -H "Authorization: Bearer {token}"
```

### Ejemplo 4: Análisis de Clientes Medianos

```bash
curl -X GET "http://localhost:3000/customers?minTotalPurchases=50000&maxTotalPurchases=150000" \
  -H "Authorization: Bearer {token}"
```

## 📊 Estructura de Respuesta

Cada cliente en la respuesta incluirá:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | ID del cliente |
| `name` | string | Nombre del cliente |
| `taxId` | string | CUIT/CUIL |
| `address` | string | Dirección |
| `contactEmail` | string | Email de contacto |
| `phoneNumber` | string | Teléfono |
| `totalSpent` | number | **Total gastado calculado** (suma de todas las órdenes) |
| `totalOrders` | number | **Cantidad de órdenes de venta** |
| `salesOrders` | array | Órdenes de venta con sus detalles |
| `createdAt` | Date | Fecha de creación |
| `updatedAt` | Date | Última actualización |
| `deletedAt` | Date \| null | Fecha de eliminación (si aplica) |

## 🎯 Casos de Uso Comunes

### 1. Dashboard de Ventas - Top 10 Clientes

```typescript
// Frontend
const response = await fetch('/customers?minTotalPurchases=0');
const { data } = await response.json();

// Ordenar por totalSpent descendente y tomar los primeros 10
const topCustomers = data
  .sort((a, b) => b.totalSpent - a.totalSpent)
  .slice(0, 10);
```

### 2. Segmentación de Clientes

```typescript
// Clientes VIP (más de $200,000)
const vipCustomers = await fetch('/customers?minTotalPurchases=200000');

// Clientes Regulares ($50,000 - $200,000)
const regularCustomers = await fetch('/customers?minTotalPurchases=50000&maxTotalPurchases=200000');

// Clientes Nuevos/Pequeños (menos de $50,000)
const newCustomers = await fetch('/customers?maxTotalPurchases=50000');
```

### 3. Búsqueda de Clientes Inactivos

```typescript
// Combinar con fecha de última orden para encontrar inactivos
const allCustomers = await fetch('/customers');
const inactiveCustomers = allCustomers.data.filter(customer => {
  const lastOrder = customer.salesOrders[customer.salesOrders.length - 1];
  const daysSinceLastOrder = (Date.now() - new Date(lastOrder.createdAt)) / (1000 * 60 * 60 * 24);
  return daysSinceLastOrder > 90; // 90 días sin comprar
});
```

### 4. Análisis de Potencial de Crecimiento

```typescript
// Clientes con pocas órdenes pero alto ticket promedio
const potentialGrowth = await fetch('/customers?minTotalPurchases=30000');
const candidates = potentialGrowth.data.filter(customer => {
  const avgOrderValue = customer.totalSpent / customer.totalOrders;
  return customer.totalOrders < 5 && avgOrderValue > 10000;
});
```

## ⚙️ Implementación Técnica

### Cálculo del Total Gastado

El total se calcula en el backend usando TypeORM QueryBuilder:

```typescript
// Subconsulta para filtrar por rango de total
const subQuery = this.customerRepository
  .createQueryBuilder('c')
  .select('c.id')
  .leftJoin('c.salesOrders', 'so')
  .leftJoin('so.details', 'sod')
  .groupBy('c.id')
  .having('COALESCE(SUM(sod.unitPrice * sod.quantityKg), 0) >= :minTotal')
  .andHaving('COALESCE(SUM(sod.unitPrice * sod.quantityKg), 0) <= :maxTotal');

// Luego se calcula manualmente para cada cliente devuelto
for (const customer of customers) {
  let totalSpent = 0;
  for (const order of customer.salesOrders) {
    for (const detail of order.details) {
      totalSpent += detail.unitPrice * detail.quantityKg;
    }
  }
  customer.totalSpent = totalSpent;
}
```

### Ventajas de este Enfoque

1. ✅ **Sin columna redundante**: No hay campo `totalPurchases` en la tabla que necesite actualizarse
2. ✅ **Siempre actualizado**: Se calcula en tiempo real con los datos actuales
3. ✅ **Filtrado eficiente**: La subconsulta permite filtrar antes de cargar todos los datos
4. ✅ **Datos completos**: Devuelve las órdenes y detalles para análisis adicional

## 🔐 Autorización

- **ADMIN**: Acceso completo a todos los filtros
- **CAPATAZ**: Solo lectura con filtros
- **OPERARIO**: Sin acceso

## 🐛 Troubleshooting

### Problema: El `totalSpent` es 0 para clientes con órdenes

**Causa**: Las órdenes no tienen detalles (`SalesOrderDetail`)

**Solución**: Verificar que las órdenes tengan al menos un `SalesOrderDetail` con `unitPrice` y `quantityKg`.

### Problema: Filtros no funcionan correctamente

**Causa**: Los query parameters deben ser números, no strings

**Solución**: El controlador convierte automáticamente con `Number(req.query.minTotalPurchases)`

### Problema: Rendimiento lento con muchos clientes

**Soluciones**:
1. Agregar índice en `sales_orders.customerId`
2. Agregar índice en `sales_order_details.salesOrderId`
3. Implementar paginación en el endpoint

```sql
CREATE INDEX idx_sales_orders_customer_id ON sales_orders(customer_id);
CREATE INDEX idx_sales_order_details_order_id ON sales_order_details(sales_order_id);
```

## 📈 Próximas Mejoras

1. **Paginación**: Agregar `page` y `limit` para grandes volúmenes
2. **Ordenamiento**: Agregar `sortBy=totalSpent&order=DESC`
3. **Estadísticas**: Agregar endpoint `/customers/stats` con métricas agregadas
4. **Caché**: Cachear resultados de clientes VIP por 1 hora
5. **Export**: Endpoint para exportar CSV/Excel con filtros aplicados
