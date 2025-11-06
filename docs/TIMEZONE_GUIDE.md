# Manejo de Fechas y Zonas Horarias

## Filosofía

Este proyecto sigue las mejores prácticas para el manejo de fechas:

1. **Todo se guarda en UTC**: La base de datos PostgreSQL siempre guarda fechas en UTC
2. **Node.js trabaja en UTC**: El servidor fuerza `TZ=UTC` al iniciar
3. **Frontend envía/recibe ISO strings**: Comunicación en formato estándar ISO 8601

## Configuración

### Base de datos (PostgreSQL)
```typescript
// src/config/typeorm.config.ts
extra: {
  timezone: 'UTC',
}
```

### Servidor (Node.js)
```typescript
// src/index.ts
process.env.TZ = 'UTC';
```

## Utilidades Disponibles

### `parseDateToUTC(dateString: string): Date`
Convierte un string de fecha a Date object en UTC.

**Casos de uso:**
```typescript
// Fecha simple (YYYY-MM-DD) -> interpreta como 00:00:00 UTC
parseDateToUTC('2025-11-07') // -> 2025-11-07T00:00:00.000Z

// Fecha con hora -> interpreta como UTC si no tiene zona
parseDateToUTC('2025-11-07T14:30:00') // -> 2025-11-07T14:30:00.000Z

// Fecha con zona horaria -> respeta la zona
parseDateToUTC('2025-11-07T14:30:00-03:00') // -> 2025-11-07T17:30:00.000Z
```

### `formatDateOnlyUTC(date: Date): string`
Convierte un Date a string solo con fecha (YYYY-MM-DD) en UTC.

```typescript
formatDateOnlyUTC(new Date('2025-11-07T14:30:00Z')) // -> '2025-11-07'
```

### `formatDateTimeUTC(date: Date): string`
Convierte un Date a ISO string completo.

```typescript
formatDateTimeUTC(new Date('2025-11-07T14:30:00')) // -> '2025-11-07T14:30:00.000Z'
```

### `nowUTC(): Date`
Obtiene la fecha/hora actual.

```typescript
const now = nowUTC(); // -> Date object con tiempo actual en UTC
```

### `todayUTC(): string`
Obtiene solo la fecha actual (sin hora).

```typescript
const today = todayUTC(); // -> '2025-11-07'
```

## Uso en Servicios

### Ejemplo: Crear una entidad con fecha del frontend

```typescript
import { parseDateToUTC, nowUTC } from '@/utils/date.utils';

// Si el frontend envía una fecha
const receivedAt = data.receivedDate 
  ? parseDateToUTC(data.receivedDate)  // Parsear la fecha del frontend
  : nowUTC();                          // O usar la fecha actual

const entity = manager.create(MyEntity, {
  someDate: receivedAt,
  // ...
});
```

### Ejemplo: Filtrar por rango de fechas

```typescript
import { parseDateToUTC } from '@/utils/date.utils';

// Frontend envía: { startDate: '2025-11-01', endDate: '2025-11-30' }
const startDate = parseDateToUTC(data.startDate);  // 2025-11-01T00:00:00.000Z
const endDate = parseDateToUTC(data.endDate);      // 2025-11-30T00:00:00.000Z

const results = await repository.find({
  where: {
    createdAt: Between(startDate, endDate),
  },
});
```

## Validación en DTOs

Para fechas que vienen del frontend, usar `@IsDateString()`:

```typescript
import { IsDateString, IsOptional } from 'class-validator';

export class MyDto {
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe ser válida (YYYY-MM-DD o ISO 8601)' })
  receivedDate?: string;  // ⚠️ Mantener como string en el DTO
}
```

**Importante**: Los DTOs reciben la fecha como `string`, luego en el servicio se convierte a `Date` usando `parseDateToUTC()`.

## Tipos de columnas en TypeORM

### Para fechas con hora (timestamps)
```typescript
@Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
createdAt: Date;
```

### Para fechas sin hora (solo fecha)
```typescript
@Column('date')
birthDate: Date;  // Se guarda solo YYYY-MM-DD
```

### Decoradores especiales de TypeORM
```typescript
@CreateDateColumn()  // Automáticamente pone la fecha actual al crear
createdAt: Date;

@UpdateDateColumn()  // Automáticamente actualiza al modificar
updatedAt: Date;

@DeleteDateColumn()  // Para soft deletes
deletedAt: Date | null;
```

## Respuestas al Frontend

TypeORM automáticamente serializa los Date objects a ISO strings cuando los envías en JSON:

```typescript
res.json({
  data: receipt,  // receivedAt será serializado a "2025-11-07T00:00:00.000Z"
});
```

Si necesitas más control, puedes usar el middleware `dateSerializerMiddleware` (ver `src/middlewares/date-serializer.middleware.ts`).

## Problemas Comunes y Soluciones

### ❌ Problema: La fecha se guarda 3 horas antes
**Causa**: No estás parseando correctamente la fecha del frontend.

**Solución**:
```typescript
// ❌ MAL - new Date() interpreta según zona horaria local
const date = new Date(data.receivedDate);

// ✅ BIEN - parseDateToUTC() siempre interpreta en UTC
const date = parseDateToUTC(data.receivedDate);
```

### ❌ Problema: Al comparar fechas no coinciden
**Causa**: Estás comparando Date con time vs Date sin time.

**Solución**:
```typescript
import { formatDateOnlyUTC } from '@/utils/date.utils';

// Si solo te importa la fecha (no la hora)
const dateOnly = formatDateOnlyUTC(entity.createdAt);
if (dateOnly === '2025-11-07') {
  // ...
}
```

### ❌ Problema: El frontend muestra una fecha diferente
**Causa**: El navegador está convirtiendo automáticamente a la zona horaria local.

**Solución**: El frontend debe manejar esto:
```javascript
// En el frontend (JavaScript/TypeScript)
const date = new Date('2025-11-07T00:00:00.000Z');

// Mostrar solo la fecha (sin conversión de zona)
date.toISOString().split('T')[0]  // -> '2025-11-07'

// O usar una librería como date-fns
import { format, parseISO } from 'date-fns';
format(parseISO(dateString), 'yyyy-MM-dd')
```

## Testing

Al escribir tests, siempre usa fechas en UTC:

```typescript
describe('GoodsReceiptService', () => {
  it('should save receivedAt in UTC', async () => {
    const result = await service.create({
      receivedDate: '2025-11-07',  // Frontend envía esto
      // ...
    }, userId);

    // Verificar que se guardó correctamente en UTC
    expect(result.receivedAt.toISOString()).toBe('2025-11-07T00:00:00.000Z');
  });
});
```

## Resumen de Reglas de Oro

1. ✅ **Siempre usa `parseDateToUTC()`** cuando recibas fechas del frontend
2. ✅ **Siempre guarda en UTC** en la base de datos
3. ✅ **Usa `nowUTC()`** en lugar de `new Date()` para fecha actual
4. ✅ **Declara fechas como `string` en DTOs**, convierte a `Date` en servicios
5. ✅ **PostgreSQL debe usar `timestamp with time zone`** para timestamps
6. ✅ **Node.js debe tener `TZ=UTC`** configurado
7. ✅ **El frontend es responsable** de mostrar fechas en zona horaria del usuario
