# Patrones de Retorno en Services

## ¿Por qué los services retornan valores en lugar de `void`?

### Problema con `Promise<void>`

```typescript
// ❌ Antipatrón
public async delete(id: string): Promise<void> {
  await this.repository.softRemove(entity);
  // ¿Cómo sabe el controller qué pasó?
}
```

**Problemas:**
1. El controller solo sabe que "no hubo error"
2. No puede dar información al usuario
3. Dificulta logging y auditoría
4. No puedes implementar "undo" fácilmente

---

## ✅ Patrón Recomendado: Retornar la Entidad

### En el Service:

```typescript
/**
 * Eliminar una orden de trabajo (soft delete)
 * @returns La orden eliminada con deletedAt timestamp
 */
public async delete(id: string): Promise<WorkOrder> {
  const workOrder = await this.findById(id);
  return await this.workOrderRepository.softRemove(workOrder);
}

/**
 * Restaurar una orden de trabajo
 * @returns La orden restaurada con deletedAt = null
 */
public async restore(id: string): Promise<WorkOrder> {
  const workOrder = await this.workOrderRepository.findOne({
    where: { id },
    withDeleted: true,
  });
  
  if (!workOrder) {
    throw new HttpException(404, "Not found");
  }
  
  return await this.workOrderRepository.recover(workOrder);
}
```

### En el Controller:

```typescript
export class WorkOrderController {
  /**
   * DELETE /work-orders/:id
   * Soft delete de una orden de trabajo
   */
  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await this.service.delete(req.params.id);
      
      // ✅ Ahora puedes:
      // 1. Retornar la entidad eliminada
      // 2. Hacer logging con datos reales
      // 3. Dar feedback al usuario
      
      return res.status(200).json({
        message: 'Work order deleted successfully',
        data: deleted,
        // Útil para "undo" en el frontend
        canRestore: true
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /work-orders/:id/restore
   * Restaurar una orden de trabajo eliminada
   */
  public restore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restored = await this.service.restore(req.params.id);
      
      return res.status(200).json({
        message: 'Work order restored successfully',
        data: restored
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /work-orders/:id/permanent
   * Hard delete - eliminar permanentemente
   */
  public hardDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await this.service.hardDelete(req.params.id);
      
      return res.status(200).json({
        message: 'Work order permanently deleted',
        data: deleted,
        canRestore: false
      });
    } catch (error) {
      next(error);
    }
  };
}
```

---

## Comparación de Respuestas HTTP

### Con `Promise<void>`:

```typescript
// Service
public async delete(id: string): Promise<void> {
  await this.repository.softRemove(entity);
}

// Controller
return res.status(204).send(); // 204 No Content - vacío
```

**Respuesta al cliente:**
```
Status: 204 No Content
Body: (vacío)
```

### Con `Promise<WorkOrder>` (Recomendado):

```typescript
// Service
public async delete(id: string): Promise<WorkOrder> {
  return await this.repository.softRemove(entity);
}

// Controller
return res.status(200).json({
  message: 'Deleted successfully',
  data: deleted
});
```

**Respuesta al cliente:**
```json
Status: 200 OK
{
  "message": "Work order deleted successfully",
  "data": {
    "id": "123",
    "title": "Riego Sector A",
    "status": "COMPLETED",
    "deletedAt": "2025-10-28T10:30:00Z"
  },
  "canRestore": true
}
```

---

## Ventajas de Retornar Entidades

### 1. **Feedback Rico al Usuario** 📢

```typescript
// Frontend puede mostrar:
"Orden de trabajo 'Riego Sector A' eliminada correctamente"
// vs simplemente:
"Eliminado"
```

### 2. **Implementar Undo Fácilmente** ↩️

```typescript
// Frontend puede guardar el objeto eliminado
const deleted = await api.deleteWorkOrder(id);
localStorage.setItem('lastDeleted', JSON.stringify(deleted));

// Y restaurarlo
await api.restoreWorkOrder(deleted.id);
```

### 3. **Logging y Auditoría** 📝

```typescript
const deleted = await this.service.delete(id);

// Ahora puedes registrar qué se eliminó
logger.info('Work order deleted', {
  id: deleted.id,
  title: deleted.title,
  deletedBy: req.user.id,
  timestamp: new Date()
});
```

### 4. **Testing Más Completo** 🧪

```typescript
it('should delete work order', async () => {
  const deleted = await service.delete('123');
  
  expect(deleted).toBeDefined();
  expect(deleted.id).toBe('123');
  expect(deleted.deletedAt).toBeTruthy();
});
```

### 5. **Webhooks y Notificaciones** 🔔

```typescript
const deleted = await this.service.delete(id);

// Enviar notificación con datos
await notificationService.send({
  type: 'WORK_ORDER_DELETED',
  title: deleted.title,
  deletedBy: user.name,
  assignedTo: deleted.assignedTo?.email
});
```

---

## Códigos HTTP Recomendados

| Operación | Código | Razón |
|-----------|--------|-------|
| **DELETE (soft)** | `200 OK` | Retorna la entidad eliminada |
| **DELETE (hard)** | `200 OK` | Retorna la entidad antes de borrar |
| **RESTORE** | `200 OK` | Retorna la entidad restaurada |
| **DELETE sin body** | `204 No Content` | Solo si no retornas nada (no recomendado) |

---

## Manejo de Errores

El patrón de excepciones sigue funcionando igual:

```typescript
// Service
public async delete(id: string): Promise<WorkOrder> {
  const workOrder = await this.findById(id); // ← Lanza 404 si no existe
  return await this.repository.softRemove(workOrder);
}

// Controller
try {
  const deleted = await this.service.delete(id);
  return res.status(200).json({ data: deleted });
} catch (error) {
  // HttpException es atrapada por el middleware de errores
  next(error);
}
```

**Flujo:**
1. ✅ **Éxito**: Service retorna entidad → Controller responde 200 con datos
2. ❌ **Error**: Service lanza `HttpException` → Middleware atrapa y responde con código apropiado

---

## Ejemplo Completo: Feature de Restore

### Service:

```typescript
public async delete(id: string): Promise<WorkOrder> {
  const workOrder = await this.findById(id);
  return await this.workOrderRepository.softRemove(workOrder);
}

public async restore(id: string): Promise<WorkOrder> {
  const workOrder = await this.workOrderRepository.findOne({
    where: { id },
    withDeleted: true,
  });
  
  if (!workOrder) {
    throw new HttpException(404, "Work order not found");
  }
  
  if (!workOrder.deletedAt) {
    throw new HttpException(400, "Work order is not deleted");
  }
  
  return await this.workOrderRepository.recover(workOrder);
}
```

### Controller:

```typescript
public delete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await this.service.delete(req.params.id);
    
    return res.status(200).json({
      message: 'Work order deleted successfully',
      data: deleted,
      actions: {
        restore: `/api/work-orders/${deleted.id}/restore`
      }
    });
  } catch (error) {
    next(error);
  }
};

public restore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restored = await this.service.restore(req.params.id);
    
    return res.status(200).json({
      message: 'Work order restored successfully',
      data: restored
    });
  } catch (error) {
    next(error);
  }
};
```

### Frontend (ejemplo React):

```typescript
// Eliminar con opción de deshacer
const handleDelete = async (id: string) => {
  try {
    const response = await api.delete(`/work-orders/${id}`);
    const deleted = response.data.data;
    
    // Mostrar toast con botón "Undo"
    toast.success(
      <div>
        Work order deleted
        <button onClick={() => handleRestore(deleted.id)}>
          Undo
        </button>
      </div>,
      { duration: 5000 }
    );
  } catch (error) {
    toast.error('Failed to delete');
  }
};

const handleRestore = async (id: string) => {
  try {
    await api.post(`/work-orders/${id}/restore`);
    toast.success('Work order restored');
    refetch(); // Refrescar lista
  } catch (error) {
    toast.error('Failed to restore');
  }
};
```

---

## Resumen

| Aspecto | `Promise<void>` | `Promise<Entity>` |
|---------|----------------|-------------------|
| **Claridad** | ⚠️ Implícito | ✅ Explícito |
| **Información** | ❌ Ninguna | ✅ Completa |
| **Debugging** | ⚠️ Difícil | ✅ Fácil |
| **Testing** | ⚠️ Limitado | ✅ Completo |
| **UX** | ❌ Genérico | ✅ Rico |
| **Undo** | ❌ Complejo | ✅ Simple |
| **Logging** | ⚠️ Limitado | ✅ Detallado |

**Recomendación:** Siempre retorna la entidad afectada en operaciones de modificación (create, update, delete, restore).
