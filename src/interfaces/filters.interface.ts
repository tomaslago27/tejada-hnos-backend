import { ActivityType, WorkOrderStatus } from "@/enums";

/**
 * Interfaz para filtros de búsqueda de órdenes de trabajo
 */
export interface WorkOrderFilters {
  assignedToId?: string;
  status?: WorkOrderStatus;
  plotId?: string;
  startDate?: Date;
  endDate?: Date;
  managedFieldIds?: string[]; // Para filtrar por campos gestionados (CAPATAZ)
}

/**
 * Interfaz para filtros de búsqueda de actividades
 */
export interface ActivityFilters {
  workOrderId?: string;
  type?: ActivityType;
  startDate?: Date;
  endDate?: Date;
  managedFieldIds?: string[]; // Para filtrar por campos gestionados (CAPATAZ)
  assignedToId?: string; // Para filtrar por OTs asignadas (OPERARIO)
}

/**
 * Interfaz para filtros de búsqueda de campos
 */
export interface FieldFilters {
  managerId?: string;
  minArea?: number;
  maxArea?: number;
  managedFieldIds?: string[]; // Para filtrar por campos gestionados (CAPATAZ)
}

/**
 * Interfaz para filtros de búsqueda de parcelas
 */
export interface PlotFilters {
  fieldId?: string;
  varietyId?: string;
  minArea?: number;
  maxArea?: number;
  managedFieldIds?: string[]; // Para filtrar por campos gestionados (CAPATAZ)
}

/**
 * Interfaz para filtros de búsqueda de clientes
 */
export interface CustomerFilters {
  searchTerm?: string;
  minTotalPurchases?: number;
  maxTotalPurchases?: number;
  withDeleted?: boolean;
}

/**
 * Interfaz para filtros de búsqueda de proveedores
 */
export interface SupplierFilters {
  searchTerm?: string;
  minTotalSupplied?: number;
  maxTotalSupplied?: number;
  withDeleted?: boolean;
}
