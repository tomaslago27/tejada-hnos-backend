# Patrones de Servicios - findAll con Filtros

## Por qué usar un método findAll() con filtros en lugar de métodos específicos

### ❌ Antipatrón: Múltiples métodos específicos

```typescript
// Muchos métodos que hacen cosas similares
class WorkOrderService {
  findAll()
  findByAssignedUser(userId)
  findByStatus(status)
  findByPlot(plotId)
  findByStatusAndUser(status, userId)
  findByPlotAndStatus(plotId, status)
  findByDateRange(start, end)
  // ... y así infinitamente
}
```

**Problemas:**
- 🔴 Explosión de métodos para cada combinación
- 🔴 Código duplicado
- 🔴 Difícil de mantener
- 🔴 No escalable

---

### ✅ Patrón Recomendado: findAll() con filtros opcionales

```typescript
interface WorkOrderFilters {
  assignedToId?: string;
  status?: WorkOrderStatus;
  plotId?: string;
  startDate?: Date;
  endDate?: Date;
}

class WorkOrderService {
  // Un solo método, infinitas combinaciones
  async findAll(filters?: WorkOrderFilters): Promise<WorkOrder[]>
}
```

**Ventajas:**
- ✅ Un solo método, flexible
- ✅ Fácil agregar nuevos filtros
- ✅ Se mapea directo desde query params
- ✅ Código limpio y mantenible

---

## Ejemplos de Uso

### En el Service:

```typescript
// Sin filtros - Todas las órdenes
const allOrders = await service.findAll();

// Solo pendientes
const pending = await service.findAll({ 
  status: WorkOrderStatus.PENDING 
});

// Órdenes de un usuario
const userOrders = await service.findAll({ 
  assignedToId: '123' 
});

// Órdenes de una parcela
const plotOrders = await service.findAll({ 
  plotId: '456' 
});

// Combinación: Pendientes de un usuario
const userPending = await service.findAll({ 
  status: WorkOrderStatus.PENDING,
  assignedToId: '123'
});

// Por rango de fechas
const dateRange = await service.findAll({
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31')
});

// Múltiples filtros
const complex = await service.findAll({
  status: WorkOrderStatus.IN_PROGRESS,
  assignedToId: '123',
  plotId: '456',
  startDate: new Date('2025-10-01')
});
```

### En el Controller:

```typescript
export class WorkOrderController {
  /**
   * GET /work-orders?status=PENDING&assignedToId=123&plotId=456
   */
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Los query params se mapean directo a los filtros
      const filters: WorkOrderFilters = {
        status: req.query.status as WorkOrderStatus,
        assignedToId: req.query.assignedToId as string,
        plotId: req.query.plotId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      // Remover propiedades undefined
      Object.keys(filters).forEach(key => 
        filters[key as keyof WorkOrderFilters] === undefined && 
        delete filters[key as keyof WorkOrderFilters]
      );

      const workOrders = await this.workOrderService.findAll(
        Object.keys(filters).length > 0 ? filters : undefined
      );

      return res.status(200).json({
        data: workOrders,
        count: workOrders.length,
        message: 'Work orders retrieved successfully.',
      });
    } catch (error) {
      next(error);
    }
  };
}
```

### Ejemplos de Endpoints:

```bash
# Todas las órdenes
GET /work-orders

# Solo pendientes
GET /work-orders?status=PENDING

# Órdenes de un usuario
GET /work-orders?assignedToId=abc-123

# Órdenes de una parcela
GET /work-orders?plotId=xyz-789

# Combinación múltiple
GET /work-orders?status=IN_PROGRESS&assignedToId=abc-123&plotId=xyz-789

# Por rango de fechas
GET /work-orders?startDate=2025-01-01&endDate=2025-12-31

# Todo combinado
GET /work-orders?status=PENDING&assignedToId=abc-123&startDate=2025-10-01
```

---

## Implementación del Service

```typescript
public async findAll(filters?: WorkOrderFilters): Promise<WorkOrder[]> {
  // Usar QueryBuilder para flexibilidad
  const queryBuilder = this.workOrderRepository
    .createQueryBuilder('workOrder')
    .leftJoinAndSelect('workOrder.assignedTo', 'user')
    .leftJoinAndSelect('workOrder.plots', 'plots')
    .leftJoinAndSelect('workOrder.activities', 'activities');

  // Aplicar filtros dinámicamente solo si existen
  if (filters) {
    if (filters.assignedToId) {
      queryBuilder.andWhere('workOrder.assignedToId = :assignedToId', { 
        assignedToId: filters.assignedToId 
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('workOrder.status = :status', { 
        status: filters.status 
      });
    }

    if (filters.plotId) {
      queryBuilder.andWhere('plots.id = :plotId', { 
        plotId: filters.plotId 
      });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('workOrder.scheduledDate >= :startDate', { 
        startDate: filters.startDate 
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('workOrder.scheduledDate <= :endDate', { 
        endDate: filters.endDate 
      });
    }
  }

  queryBuilder.orderBy('workOrder.scheduledDate', 'ASC');

  return await queryBuilder.getMany();
}
```

---

## Agregar Nuevos Filtros

Para agregar un nuevo filtro, solo necesitas:

### 1. Actualizar la interfaz:

```typescript
export interface WorkOrderFilters {
  assignedToId?: string;
  status?: WorkOrderStatus;
  plotId?: string;
  startDate?: Date;
  endDate?: Date;
  priority?: string; // ← NUEVO FILTRO
}
```

### 2. Agregar la condición en el QueryBuilder:

```typescript
if (filters.priority) {
  queryBuilder.andWhere('workOrder.priority = :priority', { 
    priority: filters.priority 
  });
}
```

¡Listo! No necesitas crear nuevos métodos ni modificar nada más.

---

## Cuándo usar métodos específicos

Hay casos donde **SÍ** tiene sentido tener métodos específicos:

### ✅ Casos válidos para métodos específicos:

1. **Lógica de negocio compleja**
   ```typescript
   // Órdenes próximas a vencer (< 24 horas)
   async findOverdue(): Promise<WorkOrder[]> {
     const tomorrow = new Date();
     tomorrow.setDate(tomorrow.getDate() + 1);
     
     return this.workOrderRepository
       .createQueryBuilder('wo')
       .where('wo.status != :completed', { completed: 'COMPLETED' })
       .andWhere('wo.dueDate < :tomorrow', { tomorrow })
       .getMany();
   }
   ```

2. **Consultas con agregaciones**
   ```typescript
   // Estadísticas por estado
   async getStatsByStatus(): Promise<StatusStats[]> {
     return this.workOrderRepository
       .createQueryBuilder('wo')
       .select('wo.status', 'status')
       .addSelect('COUNT(*)', 'count')
       .groupBy('wo.status')
       .getRawMany();
   }
   ```

3. **Joins complejos o específicos**
   ```typescript
   // Órdenes con actividades completadas hoy
   async findWithTodayActivities(): Promise<WorkOrder[]> {
     const today = new Date();
     today.setHours(0, 0, 0, 0);
     
     return this.workOrderRepository
       .createQueryBuilder('wo')
       .leftJoinAndSelect('wo.activities', 'act')
       .where('act.executionDate >= :today', { today })
       .getMany();
   }
   ```

---

## Resumen

| Criterio | Método Específico | findAll con Filtros |
|----------|------------------|---------------------|
| **Simplicidad** | ✅ Muy simple | ⚠️ Requiere interfaz |
| **Flexibilidad** | ❌ Rígido | ✅ Muy flexible |
| **Escalabilidad** | ❌ No escala | ✅ Escala bien |
| **Mantenibilidad** | ❌ Muchos métodos | ✅ Un solo método |
| **Type Safety** | ✅ Parámetros tipados | ✅ Interfaz tipada |
| **Documentación** | ✅ Autodocumentado | ⚠️ Requiere docs |
| **Testing** | ✅ Tests específicos | ⚠️ Tests combinados |

**Recomendación final:** Usa `findAll(filters)` para filtros simples y combinables. Usa métodos específicos solo para lógica de negocio compleja.
