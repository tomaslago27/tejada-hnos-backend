# Guía de Validación de DTOs con Recursos Anidados

## Problema

Cuando tienes endpoints RESTful con recursos anidados, el ID del recurso padre viene en la URL, no en el body:

```
POST /fields/:fieldId/plots
POST /work-orders/:workOrderId/activities  
POST /sales-orders/:salesOrderId/shipments
```

## Soluciones

### ✅ Opción 1: Usar Middleware `mergeParamsToBody` (Recomendado)

El middleware fusiona los parámetros de URL al body **antes** de la validación del DTO.

#### Ejemplo de uso en rutas:

```typescript
import { Router } from 'express';
import { mergeParamsToBody } from '@/middlewares/merge-params.middleware';
import { validationMiddleware } from '@/middlewares/validation.middleware';
import { CreatePlotDto } from '@/dtos/plot.dto';

const router = Router();

// El middleware fusiona fieldId de params al body antes de validar
router.post(
  '/fields/:fieldId/plots',
  mergeParamsToBody(['fieldId']),  // ← Fusionar antes de validar
  validationMiddleware(CreatePlotDto),
  plotController.createPlot
);

// Para múltiples params
router.post(
  '/orders/:orderId/items/:itemId/comments',
  mergeParamsToBody(['orderId', 'itemId']),
  validationMiddleware(CreateCommentDto),
  commentController.create
);
```

#### DTO correspondiente:

```typescript
export class CreatePlotDto {
  @IsString()
  name: string;

  @IsNumber()
  area: number;

  @IsUUID('4')
  varietyId: string;

  // fieldId es opcional porque puede venir de params o body
  @IsOptional()
  @IsUUID('4', { message: 'El ID del campo debe ser un UUID válido' })
  fieldId?: string;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;
}
```

#### Controller simplificado:

```typescript
public createPlot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Ya no necesitas agregar fieldId manualmente, el middleware lo hizo
    const plotData: CreatePlotDto = req.body; // Ya incluye fieldId validado
    const newPlot = await this.plotService.createPlot(plotData);
    return res.status(201).json(newPlot);
  } catch (error) {
    next(error);
  }
};
```

---

### ✅ Opción 2: Pasar FK como parámetro separado al Service

El service recibe el FK del padre como parámetro separado.

#### DTO sin FK del padre:

```typescript
export class CreateActivityDto {
  @IsEnum(ActivityType)
  type: ActivityType;

  @IsISO8601()
  executionDate: Date;

  @IsNumber()
  hoursWorked: number;

  // NO incluir workOrderId aquí
}
```

#### Service:

```typescript
class ActivityService {
  async createActivity(workOrderId: string, activityData: CreateActivityDto) {
    const activity = this.activityRepository.create({
      ...activityData,
      workOrderId, // ← Agregar aquí
    });
    return await this.activityRepository.save(activity);
  }
}
```

#### Controller:

```typescript
public createActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workOrderId } = req.params;
    const activityData: CreateActivityDto = req.body;
    
    // Pasar workOrderId como parámetro separado
    const newActivity = await this.activityService.createActivity(
      workOrderId,
      activityData
    );
    
    return res.status(201).json(newActivity);
  } catch (error) {
    next(error);
  }
};
```

---

### ✅ Opción 3: Validación manual en Controller

Útil si solo tienes uno o dos casos y no quieres agregar middleware.

```typescript
import { validate as isUUID } from 'uuid';

public createPlot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fieldId } = req.params;
    
    // Validar UUID manualmente
    if (!fieldId || !isUUID(fieldId)) {
      return res.status(400).json({ 
        message: 'Field ID must be a valid UUID' 
      });
    }

    req.body.fieldId = fieldId;
    const plotData: CreatePlotDto = req.body; // Ya validado por middleware
    const newPlot = await this.plotService.createPlot(plotData);
    return res.status(201).json(newPlot);
  } catch (error) {
    next(error);
  }
};
```

---

## Casos de Uso

### ✅ FK debe ser opcional en DTO cuando:
- Viene de la URL del recurso padre
- Endpoint: `POST /parent/:parentId/children`
- Ejemplos:
  - `POST /fields/:fieldId/plots` → `fieldId` opcional en DTO
  - `POST /work-orders/:workOrderId/activities` → `workOrderId` opcional en DTO
  - `POST /sales-orders/:salesOrderId/shipments` → `salesOrderId` opcional en DTO

### ✅ FK debe ser obligatorio en DTO cuando:
- Es un detalle anidado dentro del mismo body
- Se envía en el mismo request JSON
- Ejemplos:
  - `PurchaseOrderDetailDto.inputId` → obligatorio (viene en el array de details)
  - `ShipmentLotDetailDto.harvestLotId` → obligatorio (viene en el array de lotDetails)
  - `InputUsageDto.inputId` → obligatorio (viene en el array de inputsUsed)

### ✅ FK puede ser obligatorio cuando:
- El endpoint permite crear el recurso independiente
- Endpoint: `POST /plots` (sin parent en URL)
- En este caso, `fieldId` debe venir en el body y ser validado

---

## Ejemplo Completo: WorkOrder con Activities

### Rutas:
```typescript
// Crear actividad dentro de una orden
router.post(
  '/work-orders/:workOrderId/activities',
  mergeParamsToBody(['workOrderId']),
  validationMiddleware(CreateActivityDto),
  activityController.create
);

// O crear actividad independiente (menos común)
router.post(
  '/activities',
  validationMiddleware(CreateActivityDto), // workOrderId debe estar en body
  activityController.create
);
```

### DTO:
```typescript
export class CreateActivityDto {
  @IsOptional() // Opcional si viene de URL
  @IsUUID('4')
  workOrderId?: string;

  @IsEnum(ActivityType)
  type: ActivityType;

  @IsISO8601()
  executionDate: Date;

  @IsNumber()
  hoursWorked: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInputUsageDto)
  inputsUsed?: CreateInputUsageDto[];
}

// Los detalles anidados SÍ tienen FKs obligatorios
export class CreateInputUsageDto {
  @IsUUID('4') // Obligatorio
  @IsNotEmpty()
  inputId: string;

  @IsNumber()
  @Min(0.01)
  quantityUsed: number;
}
```

---

## Recomendación Final

**Para tu arquitectura, usa:**

1. **Opción 1 (Middleware)** para la mayoría de casos → Más limpio y consistente
2. **Opción 2 (Service params)** cuando prefieres ser más explícito
3. **Opción 3 (Validación manual)** solo para casos excepcionales

**Los DTOs deben tener:**
- FKs de recursos padre: `@IsOptional()` + validación UUID
- FKs de detalles anidados: `@IsNotEmpty()` + validación UUID
