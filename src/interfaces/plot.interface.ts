export enum PlotStatus {
  Disponible,
  Sembrado,
  Cosechado,
  EnMantenimiento,
  Inactivo,
  Vendido,
  Reservado,
}

export interface IPlot {
    id?: number;
    name: string;
    location?: string;
    size?: number;
    status?: PlotStatus;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
    fieldId: number;
}
