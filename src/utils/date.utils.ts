/**
 * Utilidades para manejo de fechas con zona horaria
 * 
 * FILOSOFÍA:
 * - La base de datos siempre guarda en UTC con TIMESTAMP WITH TIME ZONE
 * - Node.js siempre trabaja en UTC (configurado en index.ts con process.env.TZ = 'UTC')
 * - El frontend envía fechas en formato ISO string (YYYY-MM-DD) o (YYYY-MM-DDTHH:mm:ss)
 * - Cuando es solo fecha (YYYY-MM-DD), la interpretamos como "inicio del día en UTC"
 */

/**
 * Convierte una fecha string (YYYY-MM-DD) a un objeto Date en UTC a las 00:00:00
 * Esto evita que la zona horaria local afecte la fecha
 * 
 * @param dateString Fecha en formato YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss
 * @returns Date object en UTC
 * 
 * @example
 * parseDateToUTC('2025-11-07') // -> 2025-11-07T00:00:00.000Z
 * parseDateToUTC('2025-11-07T14:30:00') // -> 2025-11-07T14:30:00.000Z
 */
export function parseDateToUTC(dateString: string): Date {
  if (!dateString) {
    throw new Error('dateString is required');
  }

  // Si solo es fecha (YYYY-MM-DD), agregar T00:00:00Z para forzar UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(`${dateString}T00:00:00Z`);
  }

  // Si ya tiene hora, asegurarse que se interprete como UTC
  if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('T')) {
    return new Date(`${dateString}T00:00:00Z`);
  }

  // Si ya tiene zona horaria o es ISO completo, usarlo tal cual
  return new Date(dateString);
}

/**
 * Convierte un Date object a string solo con la fecha (YYYY-MM-DD) en UTC
 * Útil para enviar al frontend o para comparaciones de fecha sin hora
 * 
 * @param date Date object
 * @returns String en formato YYYY-MM-DD en UTC
 * 
 * @example
 * formatDateToUTC(new Date('2025-11-07T14:30:00Z')) // -> '2025-11-07'
 */
export function formatDateOnlyUTC(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date object');
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Convierte un Date object a string con fecha y hora en formato ISO en UTC
 * 
 * @param date Date object
 * @returns String en formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
 * 
 * @example
 * formatDateTimeUTC(new Date('2025-11-07T14:30:00')) // -> '2025-11-07T14:30:00.000Z'
 */
export function formatDateTimeUTC(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date object');
  }

  return date.toISOString();
}

/**
 * Obtiene la fecha actual en UTC como Date object
 * 
 * @returns Date object con la fecha/hora actual en UTC
 */
export function nowUTC(): Date {
  return new Date();
}

/**
 * Obtiene solo la fecha actual (sin hora) en formato YYYY-MM-DD en UTC
 * 
 * @returns String con la fecha actual en formato YYYY-MM-DD
 */
export function todayUTC(): string {
  return formatDateOnlyUTC(new Date());
}
