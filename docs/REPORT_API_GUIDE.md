<!--
  Documentación ampliada para el endpoint B2.11 - Reporte Financiero de Parcelas
  Incluye: descripción del endpoint, estructura de respuesta completa, instrucciones
  de migración para `historicCostPerUnit`, y relación de cambios implementados.
-->

# API de Reportes - Reporte Financiero de Parcelas (B2.11)

Este documento describe el endpoint principal de Business Intelligence del sistema:
`GET /api/reports/plot-summary/:plotId`, la estructura de respuesta, los campos
opcionales que puede solicitar o mostrar el frontend, y las instrucciones de
migración necesarias para garantizar precisión histórica de costos.

---

## 📊 Resumen rápido

- Endpoint: `GET /api/reports/plot-summary/:plotId`
- Acceso: `ADMIN` y `CAPATAZ` (filtrado por campos gestionados)
- Retorna: costos (RRHH + insumos), ingresos, margen, desglose para gráficos
- Precisión histórica: usa `InputUsage.historicCostPerUnit` (capturado en transacción)

---

## 🔐 Autenticación y Autorización

- Requiere header `Authorization: Bearer <access_token>`
- Roles permitidos: `ADMIN`, `CAPATAZ`.
- `CAPATAZ` solo puede consultar parcelas que pertenezcan a campos que gestiona
  (validación hecha por `authorizeFieldAccess`).

---

## 📥 Ejemplo de Request

```http
GET /api/reports/plot-summary/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <token>
```

---

## 📤 Estructura de Respuesta (completa y documentada)

La respuesta cumple con lo pedido por frontend y contiene campos adicionales
opcionales para dar flexibilidad. Todos los campos adicionales son opcionales;
si el cliente no los necesita puede ignorarlos.

Ejemplo (JSON):

```json
{
  "plotName": "A-01",
  "totalCosts": 75000.50,
  "totalRevenue": 120000.00,
  "margin": 44999.50,
  "costsBreakdown": {
    "labor": 50000.00,
    "inputs": 25000.50
  },
  "activities": [
    {
      "id": "act-001",
      "date": "2025-11-15T08:00:00.000Z",
      "type": "PODA",
      "description": "PODA - 8h @ $150.00/h + Insumos: $500.00",
      "cost": 1700.00,

      /* Campos opcionales por actividad (pueden estar presentes o no) */
      "laborCost": 1200.00,
      "inputsCost": 500.00,
      "hoursWorked": 8,
      "hourlyRate": 150.00,
      "workerName": "Juan Pérez",
      /* detalle de insumos usados (opcional, incluir solo si frontend lo requiere) */
      "inputsUsed": [
        {
          "inputId": "in-123",
          "name": "Urea",
          "quantityUsed": 10,
          "historicCostPerUnit": 50.00
        }
      ]
    }
  ],

  /* Campos opcionales a nivel de reporte */
  "plotId": "550e8400-e29b-41d4-a716-446655440000",
  "fieldName": "Campo Norte",
  "plotArea": 2.5,
  "varietyName": "Chandler",
  "costPerHectare": 30000.20,
  "revenuePerHectare": 48000.00,
  "marginPercentage": 37.50,
  "totalHarvestKg": 5000.00,
  "totalShippedKg": 4800.00,
  "reportGeneratedAt": "2025-11-22T10:30:00.000Z",
  "currency": "USD"
}
```

### Explicación de campos (obligatorios vs opcionales)

- `plotName` (string) — obligatorio. Nombre de la parcela.
- `totalCosts` (number) — obligatorio. Suma de costos (RRHH + insumos).
- `totalRevenue` (number) — obligatorio. Total ingresado por ventas vinculadas.
- `margin` (number) — obligatorio. totalRevenue - totalCosts.
- `costsBreakdown` (object) — obligatorio. `labor` y `inputs` para gráfico de torta.
- `activities` (array) — obligatorio, puede estar vacío. Cada elemento tiene al menos:
  - `id`, `date`, `type`, `description`, `cost` (cost total de la actividad)

Campos opcionales por actividad (útiles para la UI si se desea desglose):
- `laborCost` (number) — costo RRHH por actividad (hoursWorked × hourlyRate).
- `inputsCost` (number) — costo de insumos usados en la actividad.
- `hoursWorked`, `hourlyRate`, `workerName` — información adicional útil para tablas.
- `inputsUsed` (array) — desglose de insumos por actividad (cada item: `inputId`, `name?`, `quantityUsed`, `historicCostPerUnit?`).

Campos opcionales a nivel de reporte:
- `plotId`, `fieldName`, `plotArea`, `varietyName` — meta-datos.
- `costPerHectare`, `revenuePerHectare`, `marginPercentage` — métricas útiles.
- `totalHarvestKg`, `totalShippedKg` — métricas de producción/venta.
- `reportGeneratedAt`, `currency` — metadata de reporte.

> Nota: `cost` por actividad está pensado como la suma `laborCost + inputsCost`. El frontend puede mostrar `cost` simple o mostrar el desglose si detecta `laborCost`/`inputsCost`.

---

## 🛠 Cambios implementados en el backend (inventario)

Estos son los cambios de código que ya se aplicaron en el repositorio y que habilitan el endpoint:

1. `src/entities/input-usage.entity.ts`
   - Agregado `historicCostPerUnit: decimal(10,2)` — costo del insumo al momento de la transacción.

2. `src/services/activity.service.ts`
   - Al crear `Activity` con `inputsUsed`, el backend crea `InputUsage` y **captura** `Input.costPerUnit`
     en `historicCostPerUnit` dentro de la misma transacción (no se pide ni confía en el cliente).

3. `src/services/report.service.ts` (nuevo)
   - Implementa `getPlotFinancialReport(plotId)` con toda la lógica de cálculo.

4. `src/controllers/report.controller.ts` (nuevo)
   - `getPlotSummary` que valida el `plotId` y delega al servicio.

5. `src/routes/report.routes.ts` (nuevo)
   - Registra `GET /reports/plot-summary/:plotId` con `authorize(UserRole.ADMIN, UserRole.CAPATAZ)` y `authorizeFieldAccess`.

6. `src/middlewares/authorize-field-access.middleware.ts`
   - Añadida validación para que `CAPATAZ` solo vea reportes de parcelas en campos que gestiona.

7. `src/dtos/plot-report.dto.ts` (nuevo)
   - DTOs de respuesta (`PlotFinancialReportDto`, `ActivityReportItemDto`, `CostsBreakdownDto`) con campos opcionales.

8. `src/scripts/migrate-historic-cost.ts` (nuevo)
   - Script para poblar `historicCostPerUnit` en `InputUsage` existentes.

9. `package.json`
   - Script `migrate:historic-cost` agregado.

---

## 🔁 Instrucciones de migración y despliegue (detalle técnico)

### 1) ¿Por qué migrar?

El campo `historicCostPerUnit` es nuevo. Si existen `InputUsage` previos a este cambio, su
`historicCostPerUnit` será `0` hasta ser poblado. Para tener reportes históricos correctos,
es recomendable ejecutar el script de migración para asignarles un valor inicial.

### 2) Estrategias de migración

- Opción A (rápida / simple): poblar `historicCostPerUnit` con el `Input.costPerUnit` actual.
  - Ventaja: rápida, suficiente como primer paso.
  - Desventaja: no refleja variaciones de precio históricas entre la fecha del uso y hoy.

- Opción B (precisa): reconstruir histórico cruzando `goods_receipts`, `purchase_order_details`
  y otras transacciones por fecha, si existen claves que permitan relacionar una `InputUsage`
  con la compra que estableció su precio.
  - Ventaja: precisión histórica real.
  - Desventaja: complejidad y tiempo (puede requerir heurísticas y pocas garantías).

Para comenzar, aplicamos la **Opción A** y quedó incluido el script `migrate-historic-cost.ts`.

### 3) Pasos recomendados (producción)

1. Preparar ventana de mantenimiento si la tabla es muy grande (opcional).
2. Crear backup de la base de datos.
3. Si usas TypeORM en desarrollo con `synchronize: true`, la columna se crea automáticamente
   al iniciar el servidor en desarrollo. En producción usualmente `synchronize` está `false`.
   - Si tu proceso de despliegue reconstruye la estructura (migraciones automáticas), valida
     que la nueva columna sea aplicada por ese proceso.
4. Ejecutar el script de población (p. ej. con conexión al entorno objetivo):

```powershell
# En entorno donde están disponibles las variables de conexión y ts-node
npm run migrate:historic-cost
```

5. Verificar registros aleatorios `SELECT id, quantity_used, historic_cost_per_unit FROM input_usages LIMIT 10;`
6. Arrancar el servicio y probar el endpoint `GET /reports/plot-summary/:plotId`.

### 4) SQL directo (alternativa)

Si prefieres hacerlo directamente en Postgres (rápido), aquí tienes los comandos SQL:

```sql
-- 1) Añadir columna (si no la creó TypeORM)
ALTER TABLE input_usages ADD COLUMN historic_cost_per_unit numeric(10,2) DEFAULT 0;

-- 2) Poblar con el cost_per_unit actual del insumo
UPDATE input_usages iu
SET historic_cost_per_unit = i.cost_per_unit
FROM inputs i
WHERE iu.input_id = i.id
AND (iu.historic_cost_per_unit IS NULL OR iu.historic_cost_per_unit = 0);

-- 3) (Opcional) Verificación
SELECT count(*) FROM input_usages WHERE historic_cost_per_unit = 0;
```

> Atención: ejecutar `ALTER TABLE` en tablas muy grandes puede bloquear. Si la tabla es
> masiva, planificar la migración en batches o usar `pg_repack`/procedimientos sin bloqueo.

---

## ✅ Qué puede pedir/mostrar el frontend (lista para Product/UX)

El frontend puede elegir mostrar cualquiera de estos campos. Las reglas recomendadas:

- Mostrar siempre: `plotName`, `totalCosts`, `totalRevenue`, `margin`, `costsBreakdown`, `activities` (aunque esté vacío).
- Opcionalmente mostrar desglose en UI:
  - Por actividad: `laborCost` y `inputsCost` — útil para la tabla de detalle y tooltip del gráfico.
  - Mostrar `inputsUsed` sólo en la vista de detalle de actividad (colapsable).
  - Mostrar `plotArea`, `costPerHectare`, `revenuePerHectare` en vistas de análisis o export.
  - Mostrar `reportGeneratedAt` y `currency` en la cabecera del reporte.

Implementación recomendada en frontend:

1. Si detecta `laborCost` y `inputsCost` en los `activities`, mostrar columnas separadas y mantener `cost` como suma.
2. Si `inputsUsed` está presente, mostrar botón "Ver insumos" en cada fila para desplegar desglose.
3. Permitir al usuario alternar entre "Ver costo total" y "Ver desglose".

---

## 🧪 Tests y verificación rápida

Archivos útiles ya incluidos en el repo:

- `docs/report-api-tests.http` — conjunto de peticiones para VS Code REST Client
- `src/scripts/migrate-historic-cost.ts` — script para poblar historicCost

Prueba rápida recomendada (desarrollo):

```powershell
npm run dev
# Iniciar sesión como admin -> obtener token
# Ejecutar GET /reports/plot-summary/{plotId}
```

---

## 📌 Notas finales

- La modificación es `backwards-compatible` para el frontend: el cliente **no** necesita
  enviar `historicCostPerUnit` al crear actividades; el backend lo calcula.
- Si luego quieres precisión histórica avanzada, podemos implementar la Opción B y
  reconstruir precios históricos usando las tablas de compras/recepciones.
- Si querés que el endpoint devuelva menos datos por rendimiento, podemos añadir
  query params: `?includeActivities=false` o `?includeInputs=false`.

---

Si querés, ahora ejecuto el script de migración en tu entorno local (necesitaría que
confirmes que quieres correr `npm run migrate:historic-cost` aquí) y luego hacemos
una prueba en vivo del endpoint con un `plotId` real. ¿Lo ejecutamos? 
# API de Reportes - Reporte Financiero de Parcelas

## B2.11: Endpoint de Business Intelligence

Este es el endpoint más importante del sistema para análisis financiero de parcelas.

---

## 📊 Endpoint Principal

### GET `/api/reports/plot-summary/:plotId`

Obtiene el reporte financiero completo de una parcela, incluyendo:
- Costos de RRHH (mano de obra)
- Costos de insumos
- Ingresos por ventas
- Margen de ganancia
- Desglose detallado de actividades

---

## 🔐 Autenticación y Autorización

**Roles permitidos:**
- `ADMIN` - Acceso total a todas las parcelas
- `CAPATAZ` - Solo parcelas de campos gestionados por él

**Headers requeridos:**
```http
Authorization: Bearer <access_token>
```

---

## 📥 Ejemplo de Request

### Obtener reporte de una parcela

```http
GET /api/reports/plot-summary/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📤 Estructura de Respuesta

```typescript
{
  // Campos obligatorios (solicitados por frontend)
  "plotName": "A-01",
  "totalCosts": 75000.50,
  "totalRevenue": 120000.00,
  "margin": 44999.50,
  
  // Desglose de costos (para gráfico de torta)
  "costsBreakdown": {
    "labor": 50000.00,    // Costo de RRHH
    "inputs": 25000.50    // Costo de insumos
  },
  
  // Array de actividades (para tabla de detalles)
  "activities": [
    {
      "id": "act-001",
      "date": "2025-11-15T08:00:00.000Z",
      "type": "PODA",
      "description": "PODA - 8h @ $150.00/h + Insumos: $500.00",
      "cost": 1700.00,
      
      // Campos opcionales para desglose detallado
      "laborCost": 1200.00,
      "inputsCost": 500.00,
      "hoursWorked": 8,
      "hourlyRate": 150.00,
      "workerName": "Juan Pérez"
    }
    // ... más actividades
  ],
  
  // Campos opcionales (para extensibilidad futura)
  "plotId": "550e8400-e29b-41d4-a716-446655440000",
  "fieldName": "Campo Norte",
  "plotArea": 2.5,
  "varietyName": "Chandler",
  "costPerHectare": 30000.20,
  "revenuePerHectare": 48000.00,
  "marginPercentage": 37.50,
  "totalHarvestKg": 5000.00,
  "totalShippedKg": 4800.00,
  "reportGeneratedAt": "2025-11-22T10:30:00.000Z",
  "currency": "USD"
}
```

---

## ✅ Casos de Éxito

### Caso 1: Parcela con actividades completas
```http
GET /api/reports/plot-summary/550e8400-e29b-41d4-a716-446655440000
→ Status: 200 OK
→ Reporte completo con todos los cálculos
```

### Caso 2: Parcela sin actividades
```http
GET /api/reports/plot-summary/660e8400-e29b-41d4-a716-446655440001
→ Status: 200 OK
→ totalCosts: 0, totalRevenue: 0, margin: 0, activities: []
```

### Caso 3: Parcela con actividades pero sin ingresos
```http
GET /api/reports/plot-summary/770e8400-e29b-41d4-a716-446655440002
→ Status: 200 OK
→ totalCosts: 50000, totalRevenue: 0, margin: -50000
```

---

## ❌ Casos de Error

### Error 400: ID de parcela inválido
```http
GET /api/reports/plot-summary/invalid-id
→ Status: 400 Bad Request
{
  "message": "El ID de la parcela no es un UUID válido."
}
```

### Error 401: Sin autenticación
```http
GET /api/reports/plot-summary/550e8400-e29b-41d4-a716-446655440000
→ Status: 401 Unauthorized
{
  "message": "No se proporcionó token de autenticación"
}
```

### Error 403: Sin permisos (CAPATAZ accediendo a campo no gestionado)
```http
GET /api/reports/plot-summary/880e8400-e29b-41d4-a716-446655440003
→ Status: 403 Forbidden
{
  "message": "No tienes permisos para ver reportes de esta parcela. Solo puedes acceder a parcelas de los campos que gestionas."
}
```

### Error 403: Rol no autorizado (OPERARIO)
```http
GET /api/reports/plot-summary/550e8400-e29b-41d4-a716-446655440000
→ Status: 403 Forbidden
{
  "message": "No tienes permisos para acceder a este recurso",
  "requiredRoles": ["ADMIN", "CAPATAZ"],
  "userRole": "OPERARIO"
}
```

### Error 404: Parcela no encontrada
```http
GET /api/reports/plot-summary/990e8400-e29b-41d4-a716-446655440999
→ Status: 404 Not Found
{
  "message": "La parcela con ID 990e8400-e29b-41d4-a716-446655440999 no fue encontrada."
}
```

---

## 🧮 Lógica de Cálculos

### 1. Costos de RRHH (Labor)
```
Para cada Activity relacionada a la Plot:
  laborCost = activity.hoursWorked × workOrder.assignedTo.hourlyRate
  
totalLaborCost = SUM(todas las laborCost)
```

### 2. Costos de Insumos
```
Para cada InputUsage en cada Activity:
  inputCost = inputUsage.quantityUsed × inputUsage.historicCostPerUnit
  
totalInputsCost = SUM(todos los inputCost)
```

**Nota importante**: Se usa `historicCostPerUnit` (capturado al momento de la transacción) en lugar de `Input.costPerUnit` actual para garantizar precisión histórica.

### 3. Ingresos (Revenue)
```
Para cada HarvestLot de la Plot:
  Para cada ShipmentLotDetail del lote:
    revenue = shipmentLotDetail.quantityTakenKg × salesOrderDetail.unitPrice
    
totalRevenue = SUM(todos los revenue)
```

### 4. Margen
```
margin = totalRevenue - (totalLaborCost + totalInputsCost)
marginPercentage = (margin / totalRevenue) × 100
```

---

## 🔄 Dependencias

Este endpoint depende de los siguientes datos transaccionales:

1. **B2.4**: Lógica Transaccional de Compras
   - `Input.costPerUnit` base
   - `InputUsage.historicCostPerUnit` (capturado en transacción)

2. **B2.7**: Lógica Transaccional de Actividades
   - `Activity` con `hoursWorked`
   - `WorkOrder` con `assignedTo.hourlyRate`
   - `InputUsage` con cantidades y costos

3. **B2.10**: Lógica Transaccional de Envíos (Shipment)
   - `ShipmentLotDetail` con `quantityTakenKg`
   - `SalesOrderDetail` con `unitPrice`
   - `HarvestLot` vinculado a `Plot`

---

## 🧪 Testing Manual

### Usando VS Code REST Client

Crear archivo `report-tests.http`:

```http
### Variables
@baseUrl = http://localhost:3000/api
@token = {{$dotenv JWT_ACCESS_TOKEN}}
@plotId = 550e8400-e29b-41d4-a716-446655440000

### 1. Login como ADMIN
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}

### 2. Obtener reporte de parcela (como ADMIN)
GET {{baseUrl}}/reports/plot-summary/{{plotId}}
Authorization: Bearer {{token}}

### 3. Login como CAPATAZ
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "capataz@example.com",
  "password": "capataz123"
}

### 4. Obtener reporte de parcela (como CAPATAZ)
GET {{baseUrl}}/reports/plot-summary/{{plotId}}
Authorization: Bearer {{token}}

### 5. Intentar acceder sin token (debe fallar)
GET {{baseUrl}}/reports/plot-summary/{{plotId}}

### 6. ID inválido (debe fallar con 400)
GET {{baseUrl}}/reports/plot-summary/invalid-id
Authorization: Bearer {{token}}
```

---

## 📝 Notas de Implementación

### Precisión Histórica
- Se agregó el campo `historicCostPerUnit` a `InputUsage` para mantener precisión histórica
- El servidor captura automáticamente el `Input.costPerUnit` al momento de crear cada `InputUsage`
- No es necesario que el cliente envíe este valor

### Compatibilidad con Frontend
- La estructura de respuesta cumple exactamente con lo solicitado por el frontend
- Se agregaron campos opcionales para futuras extensiones sin romper compatibilidad
- Los campos opcionales permiten al frontend decidir qué mostrar

### Seguridad
- ADMIN puede ver reportes de cualquier parcela
- CAPATAZ solo puede ver reportes de parcelas en campos que gestiona
- OPERARIO no tiene acceso a reportes (403 Forbidden)

### Performance
- El servicio usa queries optimizadas con joins para minimizar consultas a BD
- Los cálculos se hacen en memoria para mejor rendimiento
- Se recomienda agregar índices en:
  - `input_usages.activity_id`
  - `input_usages.input_id`
  - `shipment_lot_details.harvest_lot_id`
  - `harvest_lots.plot_id`

---

## 🚀 Migración de Datos Existentes

Antes de usar este endpoint en producción, ejecutar la migración para poblar `historicCostPerUnit` en registros existentes:

```bash
npm run migrate:historic-cost
```

Este script:
1. Busca todos los `InputUsages` con `historicCostPerUnit = 0` o `null`
2. Obtiene el `Input.costPerUnit` actual de cada uno
3. Actualiza el campo con ese valor
4. Procesa en lotes de 100 para mejor rendimiento

**Nota**: En desarrollo con `synchronize: true`, TypeORM creará automáticamente la columna. En producción, se debe ejecutar la migración manualmente.

---

## 📚 Siguientes Pasos

Una vez validado el endpoint básico, se pueden agregar mejoras:

1. **Filtros temporales**: Reportes por rango de fechas
2. **Comparativas**: Comparar múltiples parcelas
3. **Exportación**: Generar PDF/Excel del reporte
4. **Gráficos agregados**: Reportes a nivel de campo o finca completa
5. **Proyecciones**: Estimaciones basadas en tendencias históricas
6. **Alertas**: Notificar cuando margin < umbral definido
