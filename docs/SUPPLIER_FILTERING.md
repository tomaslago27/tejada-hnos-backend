# 📊 Filtrado de Proveedores por Total Suministrado

## ✅ Implementación Completada

Se implementó un sistema para calcular y filtrar proveedores por su total suministrado **sin agregar una columna dedicada** en la base de datos.

## 🔄 Cómo Funciona

### Estructura de Datos

```
Supplier (proveedor)
    └── PurchaseOrder (orden de compra)
            └── PurchaseOrderDetail (detalle de la orden)
                    ├── unitPrice (precio unitario)
                    └── quantity (cantidad)
```

### Cálculo del Total

```typescript
Total Suministrado por Proveedor = Σ (unitPrice × quantity) 
                                   de todos los PurchaseOrderDetails
                                   de todas las PurchaseOrders del proveedor
```

**Ejemplo:**
```
Proveedor: "Insumos Agrícolas SA"
  ├── Orden 1:
  │   ├── Detalle 1: $1,500 × 20 unidades = $30,000
  │   └── Detalle 2: $800 × 50 unidades  = $40,000
  │   └─ Subtotal Orden 1: $70,000
  │
  └── Orden 2:
      └── Detalle 1: $2,000 × 15 unidades = $30,000
      └─ Subtotal Orden 2: $30,000

Total Suministrado: $100,000
```

## 🔍 Filtros Disponibles

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `searchTerm` | string | Buscar por nombre | `?searchTerm=agro` |
| `minTotalSupplied` | number | Total mínimo suministrado | `?minTotalSupplied=50000` |
| `maxTotalSupplied` | number | Total máximo suministrado | `?maxTotalSupplied=200000` |
| `withDeleted` | boolean | Incluir eliminados | `?withDeleted=true` |

## 📡 Ejemplos de Uso

### 1. Proveedores Principales (más de $100,000)

```bash
GET /suppliers?minTotalSupplied=100000
Authorization: Bearer {token}
```

### 2. Proveedores Pequeños (menos de $20,000)

```bash
GET /suppliers?maxTotalSupplied=20000
Authorization: Bearer {token}
```

### 3. Proveedores en Rango Específico

```bash
GET /suppliers?minTotalSupplied=50000&maxTotalSupplied=150000
Authorization: Bearer {token}
```

### 4. Búsqueda Combinada

```bash
GET /suppliers?searchTerm=agricola&minTotalSupplied=30000
Authorization: Bearer {token}
```

### 5. Incluir Proveedores Eliminados

```bash
GET /suppliers?withDeleted=true
Authorization: Bearer {token}
```

## 📊 Estructura de Respuesta

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Insumos Agrícolas SA",
      "taxId": "20-98765432-1",
      "address": "Zona Industrial 456",
      "contactEmail": "ventas@insumos.com",
      "phoneNumber": "+54 11 5555-6666",
      
      // Campos calculados:
      "totalSupplied": 250000.75,    // Total suministrado
      "totalOrders": 8,               // Cantidad de órdenes
      
      // Órdenes con detalles:
      "purchaseOrders": [
        {
          "id": "order-uuid",
          "status": "COMPLETADA",
          "totalAmount": 50000,
          "createdAt": "2025-09-15T10:00:00.000Z",
          "details": [
            {
              "id": "detail-uuid",
              "inputId": "input-uuid",
              "quantity": 20,
              "unitPrice": 1500.00
              // Subtotal: 20 × 1500 = $30,000
            }
          ]
        }
      ],
      
      "createdAt": "2025-01-10T10:00:00.000Z",
      "updatedAt": "2025-10-30T14:30:00.000Z",
      "deletedAt": null
    }
  ]
}
```

## 🎯 Casos de Uso

### 1. Dashboard de Compras - Top Proveedores

```typescript
// Frontend
const response = await fetch('/suppliers?minTotalSupplied=0', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data } = await response.json();

// Ordenar por totalSupplied descendente
const topSuppliers = data
  .sort((a, b) => b.totalSupplied - a.totalSupplied)
  .slice(0, 10);
```

### 2. Segmentación de Proveedores

```typescript
// Proveedores Estratégicos (más de $200,000)
const strategic = await fetch('/suppliers?minTotalSupplied=200000');

// Proveedores Regulares ($50,000 - $200,000)
const regular = await fetch('/suppliers?minTotalSupplied=50000&maxTotalSupplied=200000');

// Proveedores Ocasionales (menos de $50,000)
const occasional = await fetch('/suppliers?maxTotalSupplied=50000');
```

### 3. Análisis de Dependencia

```typescript
// Identificar proveedores críticos
async function getCriticalSuppliers() {
  const response = await fetch('/suppliers?minTotalSupplied=100000');
  const { data } = await response.json();
  
  return data.map(supplier => ({
    name: supplier.name,
    totalSupplied: supplier.totalSupplied,
    orderCount: supplier.totalOrders,
    averageOrderValue: supplier.totalSupplied / supplier.totalOrders,
    dependencyLevel: supplier.totalSupplied > 200000 ? 'HIGH' : 'MEDIUM'
  }));
}
```

### 4. Búsqueda de Proveedores para Negociación

```typescript
// Proveedores con potencial de descuento por volumen
async function getSuppliersForNegotiation() {
  const response = await fetch('/suppliers?minTotalSupplied=150000');
  const { data } = await response.json();
  
  return data.filter(supplier => {
    const avgOrder = supplier.totalSupplied / supplier.totalOrders;
    return avgOrder > 30000; // Alto valor promedio por orden
  });
}
```

## 🔐 Autorización

- **ADMIN**: Acceso completo con todos los filtros
- **CAPATAZ**: Solo lectura con filtros
- **OPERARIO**: Sin acceso

## 📋 Comparación con Customers

| Aspecto | Customers | Suppliers |
|---------|-----------|-----------|
| **Relación** | SalesOrder → SalesOrderDetail | PurchaseOrder → PurchaseOrderDetail |
| **Campo cálculo** | unitPrice × quantityKg | unitPrice × quantity |
| **Métrica** | totalSpent (gastado) | totalSupplied (suministrado) |
| **Filtro min** | minTotalPurchases | minTotalSupplied |
| **Filtro max** | maxTotalPurchases | maxTotalSupplied |
| **Endpoint** | GET /customers | GET /suppliers |

## 🧪 Tests Rápidos

### Test 1: Todos los proveedores

```bash
curl -X GET "http://localhost:3000/suppliers" \
  -H "Authorization: Bearer {admin_token}"
```

### Test 2: Proveedores principales

```bash
curl -X GET "http://localhost:3000/suppliers?minTotalSupplied=100000" \
  -H "Authorization: Bearer {admin_token}"
```

### Test 3: Búsqueda por nombre + filtro

```bash
curl -X GET "http://localhost:3000/suppliers?searchTerm=agricola&minTotalSupplied=50000" \
  -H "Authorization: Bearer {admin_token}"
```

### Test 4: Rango específico

```bash
curl -X GET "http://localhost:3000/suppliers?minTotalSupplied=30000&maxTotalSupplied=100000" \
  -H "Authorization: Bearer {admin_token}"
```

## ⚡ Ventajas del Enfoque

- ✅ **Sin columna redundante** que mantener sincronizada
- ✅ **Siempre actualizado** con datos en tiempo real
- ✅ **Filtrado eficiente** usando subconsultas SQL
- ✅ **Datos detallados** incluidos para análisis
- ✅ **Código simple** y fácil de mantener
- ✅ **Consistente** con el enfoque de Customers

## 🔄 Validación SQL

Para verificar los cálculos directamente en la base de datos:

```sql
-- Ver todos los proveedores con su total suministrado
SELECT 
  s.id,
  s.name,
  COUNT(DISTINCT po.id) as total_orders,
  COALESCE(SUM(pod.unit_price * pod.quantity), 0) as total_supplied
FROM suppliers s
LEFT JOIN purchase_orders po ON po.supplier_id = s.id
LEFT JOIN purchase_order_details pod ON pod.purchase_order_id = po.id
WHERE s.deleted_at IS NULL
GROUP BY s.id, s.name
ORDER BY total_supplied DESC;

-- Ver detalles de un proveedor específico
SELECT 
  s.name as proveedor,
  po.id as orden_id,
  po.status,
  pod.quantity,
  pod.unit_price,
  (pod.unit_price * pod.quantity) as subtotal
FROM suppliers s
LEFT JOIN purchase_orders po ON po.supplier_id = s.id
LEFT JOIN purchase_order_details pod ON pod.purchase_order_id = po.id
WHERE s.name = 'Insumos Agrícolas SA'
ORDER BY po.created_at;
```

## 📈 Mejoras Futuras

1. **Paginación**: Agregar `page` y `limit`
2. **Ordenamiento**: Agregar `sortBy=totalSupplied&order=DESC`
3. **Estadísticas**: Endpoint `/suppliers/stats` con métricas
4. **Caché**: Cachear proveedores estratégicos
5. **Alertas**: Notificar cuando un proveedor supere cierto umbral

## ✨ Resumen

Se implementó exitosamente el filtrado de proveedores por total suministrado usando el mismo enfoque que Customers:

- **Cálculo dinámico**: `unitPrice × quantity` de todos los detalles
- **Filtros flexibles**: Por nombre y rango de total
- **Sin redundancia**: No se agregó ninguna columna a la BD
- **Alto rendimiento**: Subconsultas optimizadas
- **Datos completos**: Incluye órdenes y detalles para análisis

¡Listo para usar! 🚀
