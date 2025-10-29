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
}

/**
 * Interfaz para filtros de búsqueda de actividades
 */
export interface ActivityFilters {
  workOrderId?: string;
  type?: ActivityType;
  startDate?: Date;
  endDate?: Date;
}
