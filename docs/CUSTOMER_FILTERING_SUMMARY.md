# 📊 Resumen: Filtrado de Clientes por Total Gastado

## ✅ Implementación Completada

Se implementó un sistema para calcular y filtrar clientes por su total gastado **sin agregar una columna dedicada** en la base de datos.

## 🔄 Cómo Funciona

### Estructura de Datos

```
Customer (cliente)
    └── SalesOrder (orden de venta)
            └── SalesOrderDetail (detalle de la orden)
                    ├── unitPrice (precio unitario)
                    └── quantityKg (cantidad en kg)
```

### Cálculo del Total

```typescript
Total Gastado por Cliente = Σ (unitPrice × quantityKg) 
                           de todos los SalesOrderDetails
                           de todas las SalesOrders del cliente
```

**Ejemplo:**
```
Cliente: "Supermercado Central"
  ├── Orden 1:
  │   ├── Detalle 1: $500 × 100kg = $50,000
  │   └── Detalle 2: $400 × 50kg  = $20,000
  │   └─ Subtotal Orden 1: $70,000
  │
  └── Orden 2:
      └── Detalle 1: $600 × 80kg = $48,000
      └─ Subtotal Orden 2: $48,000

Total Gastado: $118,000
```

## 🆕 Nuevas Características

### 1. Endpoint Mejorado

**Antes:**
```http
GET /customers?includeDeleted=true
```

**Ahora:**
```http
GET /customers?searchTerm=super&minTotalPurchases=50000&maxTotalPurchases=200000&withDeleted=true
```

### 2. Respuesta Enriquecida

**Campos Agregados:**
- `totalSpent`: Total gastado calculado en tiempo real
- `totalOrders`: Cantidad de órdenes del cliente
- `salesOrders`: Órdenes con sus detalles completos

```json
{
  "id": "uuid",
  "name": "Cliente SA",
  "totalSpent": 150000.50,      // ← NUEVO
  "totalOrders": 12,             // ← NUEVO
  "salesOrders": [               // ← EXPANDIDO con details
    {
      "id": "order-1",
      "details": [
        {
          "unitPrice": 500,
          "quantityKg": 100
        }
      ]
    }
  ]
}
```

## 📋 Filtros Disponibles

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `searchTerm` | string | Buscar por nombre | `?searchTerm=super` |
| `minTotalPurchases` | number | Total mínimo gastado | `?minTotalPurchases=50000` |
| `maxTotalPurchases` | number | Total máximo gastado | `?maxTotalPurchases=200000` |
| `withDeleted` | boolean | Incluir eliminados | `?withDeleted=true` |

## 🎯 Casos de Uso

### 1. Dashboard - Top Clientes
```bash
GET /customers?minTotalPurchases=100000
# Devuelve: Clientes VIP con más de $100k gastados
```

### 2. Segmentación de Mercado
```bash
# Clientes Pequeños ($0 - $10k)
GET /customers?maxTotalPurchases=10000

# Clientes Medianos ($10k - $100k)
GET /customers?minTotalPurchases=10000&maxTotalPurchases=100000

# Clientes VIP ($100k+)
GET /customers?minTotalPurchases=100000
```

### 3. Búsqueda Combinada
```bash
GET /customers?searchTerm=mayorista&minTotalPurchases=50000
# Devuelve: Mayoristas que hayan gastado más de $50k
```

## 🏗️ Arquitectura de la Solución

### Archivos Modificados

#### 1. `customer.service.ts`
```typescript
async findAll(filters: CustomerFilters): Promise<Customer[]> {
  // 1. Query con LEFT JOIN a salesOrders y details
  // 2. Subconsulta para filtrar por rango de total gastado
  // 3. Cálculo manual del totalSpent para cada cliente
  // 4. Agregar totalOrders usando loadRelationCountAndMap
}
```

**Ventajas:**
- ✅ No hay columna redundante que mantener sincronizada
- ✅ Siempre refleja datos actuales
- ✅ Permite análisis detallado con órdenes incluidas

#### 2. `customer.controller.ts`
```typescript
getAll = async (req: Request, res: Response) => {
  // 1. Extraer query parameters
  // 2. Construir objeto CustomerFilters
  // 3. Llamar a service.findAll(filters)
  // 4. Devolver respuesta con datos enriquecidos
}
```

#### 3. `filters.interface.ts`
```typescript
export interface CustomerFilters {
  searchTerm?: string;
  minTotalPurchases?: number;
  maxTotalPurchases?: number;
  withDeleted?: boolean;
}
```

## 📊 Flujo de Ejecución

```
1. Cliente HTTP → GET /customers?minTotalPurchases=50000

2. Controller extrae parámetros → { minTotalPurchases: 50000 }

3. Service ejecuta query SQL:
   ┌─────────────────────────────────────────┐
   │ SELECT c.*, SUM(d.unitPrice * d.qty)   │
   │ FROM customers c                        │
   │ LEFT JOIN sales_orders so ON c.id      │
   │ LEFT JOIN sales_order_details d ON so  │
   │ GROUP BY c.id                           │
   │ HAVING SUM(...) >= 50000                │
   └─────────────────────────────────────────┘

4. Service calcula totalSpent manualmente por cliente

5. Controller devuelve JSON con datos enriquecidos
   ↓
   {
     "success": true,
     "data": [
       { "id": "...", "totalSpent": 150000, ... }
     ]
   }
```

## 🔍 Comparación de Enfoques

### ❌ Enfoque Anterior (Columna Dedicada)

```sql
ALTER TABLE customers ADD COLUMN total_purchases DECIMAL(10,2);

-- Problema 1: Mantener sincronizado
UPDATE customers SET total_purchases = (
  SELECT SUM(...)
) WHERE id = ?;

-- Problema 2: ¿Cuándo actualizar?
-- - Al crear orden ✓
-- - Al actualizar orden ✓
-- - Al eliminar orden ✓
-- - Al actualizar detalle ✓
-- - Al eliminar detalle ✓
-- Mucha complejidad!
```

**Desventajas:**
- 🔴 Datos pueden desincronizarse
- 🔴 Complejidad adicional en triggers/eventos
- 🔴 Redundancia de datos
- 🔴 Difícil de mantener

### ✅ Enfoque Actual (Cálculo en Tiempo Real)

```typescript
// Se calcula al momento de la consulta
const totalSpent = salesOrders.reduce((total, order) => {
  return total + order.details.reduce((sum, detail) => {
    return sum + (detail.unitPrice * detail.quantityKg);
  }, 0);
}, 0);
```

**Ventajas:**
- ✅ Siempre actualizado
- ✅ Sin redundancia
- ✅ Código simple
- ✅ Fácil de mantener
- ✅ Incluye datos detallados para análisis

## ⚡ Optimizaciones Aplicadas

### 1. Subconsulta para Filtrado
```typescript
// En lugar de cargar TODOS y filtrar en memoria:
const subQuery = repository
  .select('c.id')
  .having('SUM(...) >= :min AND SUM(...) <= :max');

// Solo cargamos los que cumplen el filtro
query.andWhere(`customer.id IN (${subQuery.getQuery()})`);
```

### 2. Eager Loading de Relaciones
```typescript
.leftJoinAndSelect('customer.salesOrders', 'orders')
.leftJoinAndSelect('orders.details', 'details')
// Carga todo en una sola query en lugar de N+1
```

### 3. Contador de Órdenes
```typescript
.loadRelationCountAndMap('customer.totalOrders', 'customer.salesOrders')
// Evita COUNT(*) separado
```

## 📈 Mejoras Futuras Sugeridas

### 1. Paginación
```typescript
interface CustomerFilters {
  // ... filtros existentes
  page?: number;
  limit?: number;
}
```

### 2. Ordenamiento
```typescript
interface CustomerFilters {
  // ... filtros existentes
  sortBy?: 'name' | 'totalSpent' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}
```

### 3. Caché para Clientes VIP
```typescript
// Redis con TTL de 1 hora
const cachedVIPCustomers = await redis.get('vip-customers');
if (!cachedVIPCustomers) {
  const vips = await findAll({ minTotalPurchases: 100000 });
  await redis.setex('vip-customers', 3600, JSON.stringify(vips));
}
```

### 4. Índices de Base de Datos
```sql
-- Mejorar performance de joins
CREATE INDEX idx_sales_orders_customer_id 
ON sales_orders(customer_id);

CREATE INDEX idx_sales_order_details_order_id 
ON sales_order_details(sales_order_id);
```

## 📚 Documentación Creada

1. **CUSTOMER_FILTERING_EXAMPLES.md**
   - Explicación detallada de filtros
   - Casos de uso comunes
   - Ejemplos de integración frontend

2. **CUSTOMER_FILTERING_TESTS.md**
   - Tests manuales paso a paso
   - Datos de prueba
   - Validaciones esperadas
   - Queries SQL para verificación

3. **CUSTOMER_SUPPLIER_API.md** (actualizado)
   - Documentación del endpoint mejorado
   - Ejemplos de query parameters
   - Estructura de respuesta actualizada

## ✨ Resultado Final

### Antes:
```json
GET /customers
{
  "data": [
    {
      "id": "uuid",
      "name": "Cliente SA"
    }
  ]
}
```

### Ahora:
```json
GET /customers?minTotalPurchases=50000
{
  "data": [
    {
      "id": "uuid",
      "name": "Cliente SA",
      "totalSpent": 150000.50,
      "totalOrders": 12,
      "salesOrders": [
        {
          "id": "order-1",
          "status": "COMPLETADA",
          "details": [
            {
              "caliber": "Grande",
              "variety": "Thompson",
              "unitPrice": 500.00,
              "quantityKg": 100.00,
              "subtotal": 50000.00
            }
          ]
        }
      ]
    }
  ]
}
```

## 🎓 Conclusión

Se implementó un sistema robusto y eficiente para:
- ✅ Calcular el total gastado por cliente sin columnas redundantes
- ✅ Filtrar por rangos de total gastado
- ✅ Combinar múltiples filtros (nombre + total)
- ✅ Incluir datos detallados para análisis
- ✅ Mantener el código simple y mantenible

**Sin agregar ninguna columna a la base de datos** 🎉
