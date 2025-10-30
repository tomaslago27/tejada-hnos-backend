# Guía de Autorización y Seguridad

## Middleware de Autorización

Este proyecto implementa dos niveles de autorización:

### 1. **Autorización por Rol** (`authorize`)
Middleware básico que verifica que el usuario tenga uno de los roles permitidos.

```typescript
import { authorize } from '@middlewares/authorize.middleware';
import { UserRole } from '@/enums';

// Solo Admin
router.delete('/:id/permanent', authorize(UserRole.ADMIN), controller.hardDelete);

// Admin y Capataz
router.post('/', authorize(UserRole.ADMIN, UserRole.CAPATAZ), controller.create);
```

### 2. **Autorización por Campos Gestionados** (`authorizeFieldAccess`)
Middleware avanzado que implementa la lógica de seguridad central basada en los campos gestionados por el usuario.

## Lógica de Seguridad Central

### **ADMIN** 
- ✅ Tiene acceso total (sin filtros)
- ✅ Puede ver todas las OTs, parcelas, reportes, etc.

### **CAPATAZ**
- ✅ Obtiene los `managedFields` del usuario desde la base de datos
- ✅ Solo ve las OTs de las parcelas dentro de sus campos gestionados
- ✅ También ve las OTs que le están asignadas directamente
- ⚠️ Si no tiene campos gestionados, se comporta como OPERARIO

**Criterios de Aceptación:**
- Un CAPATAZ solo ve las OTs de las parcelas dentro de sus campos gestionados
- Un CAPATAZ ve las OTs asignadas a él
- Un CAPATAZ con acceso a un campo puede ver todas las parcelas de ese campo

### **OPERARIO**
- ✅ Solo ve las OTs asignadas a él (`assignedToId`)
- ❌ No puede ver OTs de otros usuarios
- ❌ No puede filtrar por otros usuarios

## Uso en Rutas

### Ejemplo con Work Orders

```typescript
import { authenticate } from '@middlewares/auth.middleware';
import { authorize } from '@middlewares/authorize.middleware';
import { authorizeFieldAccess } from '@middlewares/authorize-field-access.middleware';
import { UserRole } from '@/enums';
import { DataSource } from 'typeorm';

export const createWorkOrderRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const workOrderController = new WorkOrderController(dataSource);

  // 1. authenticate: Verifica que el usuario esté autenticado
  router.use(authenticate);

  /**
   * GET /work-orders
   * 2. authorizeFieldAccess: Aplica filtros según el rol
   *    - ADMIN: Sin filtros
   *    - CAPATAZ: Filtra por managedFields + assignedToId
   *    - OPERARIO: Filtra solo por assignedToId
   */
  router.get('/', authorizeFieldAccess(dataSource), workOrderController.getAll);

  /**
   * GET /work-orders/:id
   * Valida que el usuario tenga acceso a esta OT específica
   */
  router.get('/:id', authorizeFieldAccess(dataSource), workOrderController.getById);

  /**
   * POST /work-orders
   * 3. authorize: Verifica que el usuario tenga el rol adecuado
   * 4. authorizeFieldAccess: Valida que las parcelas pertenezcan a campos gestionados
   */
  router.post(
    '/',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    authorizeFieldAccess(dataSource),
    validateData(CreateWorkOrderDto),
    workOrderController.create
  );

  return router;
};
```

## Flujo de Autorización

```
Request
   ↓
authenticate (verifica JWT)
   ↓
authorize (verifica rol)
   ↓
authorizeFieldAccess (aplica lógica de campos)
   ↓
   ├─ ADMIN → Sin filtros (next)
   ├─ CAPATAZ → Agrega managedFieldIds al request
   └─ OPERARIO → Fuerza assignedToId = userId
   ↓
Controller (usa req.managedFieldIds si existe)
   ↓
Service (aplica filtros)
   ↓
Response
```

## Integración en Servicios

Los servicios deben aceptar `managedFieldIds` en los filtros:

### WorkOrderFilters Interface
```typescript
export interface WorkOrderFilters {
  assignedToId?: string;
  status?: WorkOrderStatus;
  plotId?: string;
  startDate?: Date;
  endDate?: Date;
  managedFieldIds?: string[]; // Para CAPATAZ
}
```

### WorkOrderService.findAll()
```typescript
public async findAll(filters?: WorkOrderFilters): Promise<WorkOrder[]> {
  const queryBuilder = this.workOrderRepository
    .createQueryBuilder('workOrder')
    .leftJoinAndSelect('workOrder.plots', 'plots');

  if (filters?.managedFieldIds && filters.managedFieldIds.length > 0) {
    queryBuilder.andWhere(
      '(plots.fieldId IN (:...managedFieldIds) OR workOrder.assignedToId = :assignedToId)',
      { 
        managedFieldIds: filters.managedFieldIds,
        assignedToId: filters.assignedToId
      }
    );
  }

  return await queryBuilder.getMany();
}
```

## Integración en Controladores

Los controladores deben pasar `req.managedFieldIds` a los servicios:

```typescript
public getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: WorkOrderFilters = {};

    // ... otros filtros ...

    // Agregar managedFieldIds desde el middleware
    if (req.managedFieldIds && req.managedFieldIds.length > 0) {
      filters.managedFieldIds = req.managedFieldIds;
    }

    const workOrders = await this.workOrderService.findAll(filters);

    res.status(StatusCodes.OK).json({
      data: workOrders,
      count: workOrders.length,
      message: 'Órdenes de trabajo obtenidas exitosamente.',
    });
  } catch (error) {
    next(error);
  }
};
```

## Manejo de Errores

El middleware `authorizeFieldAccess` lanza las siguientes excepciones:

- `401 UNAUTHORIZED`: Usuario no autenticado
- `403 FORBIDDEN`: 
  - Un OPERARIO intenta ver OTs de otro usuario
  - Un CAPATAZ intenta acceder a parcelas fuera de sus campos gestionados
  - Rol no válido
- `404 NOT_FOUND`: Usuario no encontrado en la base de datos

## Testing

### Casos de prueba sugeridos:

1. **ADMIN**
   - ✅ Puede ver todas las OTs sin filtros
   - ✅ Puede acceder a cualquier parcela

2. **CAPATAZ con managedFields**
   - ✅ Ve OTs de parcelas en sus campos
   - ✅ Ve OTs asignadas a él
   - ❌ No ve OTs de parcelas fuera de sus campos
   - ❌ No ve OTs no asignadas de otros campos

3. **CAPATAZ sin managedFields**
   - ✅ Solo ve OTs asignadas a él (comportamiento de OPERARIO)

4. **OPERARIO**
   - ✅ Solo ve OTs asignadas a él
   - ❌ No puede filtrar por assignedToId diferente
   - ❌ No puede acceder a OTs de otros usuarios

## Próximos Pasos

1. Aplicar `authorizeFieldAccess` a las rutas de:
   - ✅ Work Orders
   - ⏳ Plots
   - ⏳ Activities
   - ⏳ Reports

2. Actualizar los servicios correspondientes para usar `managedFieldIds`

3. Agregar tests automatizados para validar la lógica de autorización
