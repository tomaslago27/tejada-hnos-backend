export enum UserRole {
  ADMIN = 'ADMIN',
  OPERARIO = 'OPERARIO',
  CAPATAZ = 'CAPATAZ',
}

export enum ActivityType {
  PODA = 'PODA',
  RIEGO = 'RIEGO',
  APLICACION = 'APLICACION',
  COSECHA = 'COSECHA',
  MANTENIMIENTO = 'MANTENIMIENTO',
  MONITOREO = 'MONITOREO',
  OTRO = 'OTRO',
}

export enum WorkOrderStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum InputUnit {
  KG = 'KG',
  LITRO = 'LITRO',
  UNIDAD = 'UNIDAD', // Para trampas, herramientas, etc.
}
