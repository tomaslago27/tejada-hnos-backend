/**
 * Validar si una cadena es un UUID válido
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validar y lanzar error si el UUID no es válido
 */
export function validateUUID(uuid: string, fieldName: string = 'ID'): void {
  if (!uuid) {
    throw new Error(`${fieldName} es requerido`);
  }
  
  if (!isValidUUID(uuid)) {
    throw new Error(`${fieldName} no es un UUID válido. Formato esperado: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`);
  }
}
