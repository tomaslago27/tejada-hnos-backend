# Implementación del Middleware de Autorización por Campos Gestionados

## 📋 Resumen

Se ha implementado exitosamente un sistema de autorización avanzado basado en **campos gestionados** (`managedFields`) que cumple con los siguientes requisitos:

### Lógica de Seguridad Central

#### ✅ **ADMIN**
- Acceso total sin filtros
- Puede ver todas las OTs, parcelas, reportes, etc.

#### ✅ **CAPATAZ**
- Ve las OTs de las parcelas dentro de sus campos gestionados
- También ve las OTs que le están asignadas directamente
- Solo puede acceder a parcelas de sus campos gestionados
- Si no tiene campos gestionados, se comporta como OPERARIO

#### ✅ **OPERARIO**
- Solo ve las OTs asignadas a él (`assignedToId`)
- Las peticiones se filtran automáticamente por `assignedToId = userId`

---

## 📁 Archivos Creados/Modificados

### 🆕 Nuevos Archivos

1. **`src/middlewares/authorize-field-access.middleware.ts`**
   - Middleware principal que implementa la lógica de autorización
   - Valida acceso basado en `managedFields` del usuario
   - Aplica filtros automáticos según el rol
   - Agrega `managedFieldIds` al request para uso en servicios

2. **`docs/AUTHORIZATION_GUIDE.md`**
   - Guía completa de uso del sistema de autorización
   - Ejemplos de integración en rutas
   - Flujo de autorización detallado
   - Patrones de implementación

3. **`docs/AUTHORIZATION_TESTING.md`**
   - Casos de prueba manuales
   - Scripts SQL para preparación de datos
   - Matriz de validación por rol y endpoint
   - Troubleshooting común

### ✏️ Archivos Modificados

1. **`src/middlewares/auth.middleware.ts`**
   - Agregado `managedFieldIds?: string[]` a la interfaz `Request`

2. **`src/interfaces/filters.interface.ts`**
   - Agregado `managedFieldIds?: string[]` a `WorkOrderFilters`
   - Agregado `managedFieldIds?: string[]` a `PlotFilters`

3. **`src/services/work-order.service.ts`**
   - Implementado filtro por `managedFieldIds` en `findAll()`
   - Query: `(plots.fieldId IN (...managedFieldIds) OR assignedToId = userId)`

4. **`src/services/plot.service.ts`**
   - Implementado filtro por `managedFieldIds` en `getAllPlots()`
   - Query: `plot.fieldId IN (...managedFieldIds)`

5. **`src/controllers/work-order.controller.ts`**
   - Agregada lógica para pasar `req.managedFieldIds` a los filtros

6. **`src/controllers/plot.controller.ts`**
   - Agregada lógica para pasar `req.managedFieldIds` a los filtros

7. **`src/routes/work-order.routes.ts`**
   - Integrado `authorizeFieldAccess(dataSource)` en rutas GET
   - Documentación actualizada con información de seguridad

8. **`src/routes/plot.routes.ts`**
   - Integrado `authorizeFieldAccess(dataSource)` en rutas GET
   - Documentación actualizada con información de seguridad

---

## 🔄 Flujo de Autorización

```
Cliente
   ↓
   📨 Request: GET /work-orders
   ↓
✅ authenticate (verifica JWT)
   ↓
   ├─ Extrae userId, email, role del token
   └─ Agrega req.user
   ↓
✅ authorizeFieldAccess (aplica lógica de campos)
   ↓
   ├─ ADMIN → next() (sin filtros)
   ├─ CAPATAZ → Carga managedFields desde BD
   │             Agrega req.managedFieldIds
   │             next()
   └─ OPERARIO → Fuerza req.query.assignedToId = userId
                 next()
   ↓
✅ Controller
   ↓
   └─ Construye filters con managedFieldIds si existe
   ↓
✅ Service
   ↓
   └─ QueryBuilder aplica filtro managedFieldIds
   ↓
   📦 Response (datos filtrados según rol)
```

---

## 🎯 Integración en Nuevos Endpoints

### 1. Agregar filtro en Interface

```typescript
// src/interfaces/filters.interface.ts
export interface ActivityFilters {
  workOrderId?: string;
  type?: ActivityType;
  managedFieldIds?: string[]; // ← Agregar
}
```

### 2. Actualizar Service

```typescript
// src/services/activity.service.ts
public async findAll(filters?: ActivityFilters): Promise<Activity[]> {
  const queryBuilder = this.activityRepository
    .createQueryBuilder('activity')
    .leftJoinAndSelect('activity.workOrder', 'workOrder')
    .leftJoinAndSelect('workOrder.plots', 'plots');

  // ... otros filtros ...

  // Filtro por managedFields
  if (filters?.managedFieldIds && filters.managedFieldIds.length > 0) {
    queryBuilder.andWhere('plots.fieldId IN (:...managedFieldIds)', {
      managedFieldIds: filters.managedFieldIds
    });
  }

  return await queryBuilder.getMany();
}
```

### 3. Actualizar Controller

```typescript
// src/controllers/activity.controller.ts
public getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: ActivityFilters = {};

    // ... otros filtros ...

    // Agregar managedFieldIds
    if (req.managedFieldIds && req.managedFieldIds.length > 0) {
      filters.managedFieldIds = req.managedFieldIds;
    }

    const activities = await this.activityService.findAll(filters);
    res.status(StatusCodes.OK).json({ data: activities });
  } catch (error) {
    next(error);
  }
};
```

### 4. Agregar Middleware en Rutas

```typescript
// src/routes/activity.routes.ts
import { authorizeFieldAccess } from '@middlewares/authorize-field-access.middleware';

router.get('/', authorizeFieldAccess(dataSource), activityController.getAll);
router.get('/:id', authorizeFieldAccess(dataSource), activityController.getById);
```

---

## 🧪 Testing Recomendado

### Casos Críticos

1. **ADMIN**
   - ✅ Ve todos los registros sin restricciones
   
2. **CAPATAZ con campos gestionados**
   - ✅ Ve OTs de parcelas en sus campos
   - ✅ Ve OTs asignadas a él
   - ❌ No ve OTs fuera de sus campos
   
3. **CAPATAZ sin campos gestionados**
   - ✅ Solo ve OTs asignadas a él (comportamiento OPERARIO)
   
4. **OPERARIO**
   - ✅ Solo ve OTs asignadas a él
   - ❌ No puede filtrar por otros usuarios

### Herramientas

- **Manual**: Ver `docs/AUTHORIZATION_TESTING.md`
- **Automatizado**: Considerar crear tests con Jest/Supertest
- **Postman**: Importar colección con casos de prueba

---

## 🚀 Próximos Pasos

### Pendientes de Implementación

1. **Aplicar a otros módulos:**
   - ⏳ Activities
   - ⏳ Harvest Lots
   - ⏳ Shipments
   - ⏳ Reports

2. **Mejoras adicionales:**
   - Agregar logging/auditoría de accesos
   - Implementar cache de `managedFields` en Redis
   - Crear tests automatizados
   - Agregar métricas de performance

3. **Documentación:**
   - Actualizar API docs (Swagger/OpenAPI)
   - Crear diagramas de flujo visuales
   - Documentar casos edge

---

## 📚 Documentación Relacionada

- **Guía de uso**: `docs/AUTHORIZATION_GUIDE.md`
- **Testing manual**: `docs/AUTHORIZATION_TESTING.md`
- **Patrones de servicio**: `docs/SERVICE_PATTERNS.md`
- **Autenticación**: `docs/AUTHENTICATION.md`

---

## 🛡️ Seguridad

### Validaciones Implementadas

✅ Usuario autenticado (JWT válido)
✅ Rol válido (ADMIN, CAPATAZ, OPERARIO)
✅ Campos gestionados cargados desde BD
✅ Acceso a recursos validado antes de llegar al service
✅ Filtros forzados según rol (no bypasseable)
✅ Mensajes de error descriptivos sin exponer información sensible

### Vulnerabilidades Mitigadas

❌ **Bypass de filtros**: Los filtros se aplican en el middleware, no en query params manipulables
❌ **Escalación de privilegios**: Validación estricta de roles en cada endpoint
❌ **Data leakage**: CAPATAZ/OPERARIO solo ven datos de sus campos/asignaciones
❌ **Inyección**: Uso de QueryBuilder con parámetros parametrizados

---

## 📊 Impacto en Performance

- **ADMIN**: Sin impacto (no aplica filtros adicionales)
- **CAPATAZ**: 1 query adicional para cargar `managedFields` (cacheable)
- **OPERARIO**: Sin queries adicionales (solo fuerza filtro en query)

### Optimizaciones Sugeridas

1. **Cache de managedFields**:
```typescript
// Redis cache: 5 minutos TTL
const cachedFields = await redis.get(`user:${userId}:managedFields`);
```

2. **Índices en BD**:
```sql
CREATE INDEX idx_fields_manager ON fields(managerId);
CREATE INDEX idx_plots_field ON plots(fieldId);
CREATE INDEX idx_work_orders_assigned ON work_orders(assignedToId);
```

---

## ✅ Checklist de Implementación Completada

- [x] Crear middleware `authorizeFieldAccess`
- [x] Extender interfaz `Request` con `managedFieldIds`
- [x] Actualizar interfaces de filtros
- [x] Implementar filtros en servicios (WorkOrder, Plot)
- [x] Actualizar controladores para pasar `managedFieldIds`
- [x] Integrar middleware en rutas
- [x] Crear documentación de uso
- [x] Crear guía de testing
- [x] Verificar compilación sin errores
- [x] Crear resumen de implementación

---

## 👥 Contacto y Soporte

Para dudas o problemas con la implementación, consultar:
- `docs/AUTHORIZATION_GUIDE.md` - Guía completa
- `docs/AUTHORIZATION_TESTING.md` - Casos de prueba
- Issues en el repositorio del proyecto

---

**Implementación completada exitosamente** ✅
**Fecha**: 30 de octubre de 2025
**Versión**: 1.0.0
