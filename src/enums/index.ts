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

export enum HarvestLotStatus {
  PENDIENTE_PROCESO = 'PENDIENTE_PROCESO', // Recién cosechado, húmedo (solo peso bruto)
  EN_STOCK = 'EN_STOCK', // Procesado, seco, listo para venta (peso neto)
  VENDIDO = 'VENDIDO', // Se vendió todo el stock de este lote
}

export enum WalnutCaliber {
  JUMBO = 'JUMBO', // Extra grandes
  LARGE = 'LARGE', // Grandes
  MEDIUM = 'MEDIUM', // Medianas
  SMALL = 'SMALL', // Pequeñas
  HALVES = 'HALVES', // Partidas (mitades)
  PIECES = 'PIECES', // Trozos
}

export enum PurchaseOrderStatus {
  PENDIENTE = 'PENDIENTE', // Recién creada
  APROBADA = 'APROBADA', // Aprobada por gerencia, lista para recibir
  RECIBIDA = 'RECIBIDA', // Mercadería recibida totalmente
  RECIBIDA_PARCIAL = 'RECIBIDA_PARCIAL', // Recepción parcial registrada
  CERRADA = 'CERRADA', // Completada
  CANCELADA = 'CANCELADA',
}

export enum SalesOrderStatus {
  PENDIENTE = 'PENDIENTE', // Presupuesto enviado
  APROBADA = 'APROBADA', // Cliente confirmó, listo para despachar
  DESPACHADA_PARCIAL = 'DESPACHADA_PARCIAL', // Mercadería enviada (parcial o total)
  DESPACHADA_TOTAL = 'DESPACHADA_TOTAL', // Mercadería totalmente enviada
  PAGADA = 'PAGADA', // Pago recibido (parcial o total)
  CERRADA = 'CERRADA', // Completada (para archivar)
  CANCELADA = 'CANCELADA',
}

export enum SalesOrderDetailStatus {
  PENDIENTE = 'PENDIENTE',
  DESPACHADA_PARCIAL = 'DESPACHADA_PARCIAL',
  COMPLETA = 'COMPLETA',
}
