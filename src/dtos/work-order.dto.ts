import { IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { WorkOrderStatus } from "@/enums";

export class CreateWorkOrderDto {
  @IsString({ message: 'El título debe ser texto' })
  @IsNotEmpty({ message: 'El título no puede estar vacío' })
  title: string;

  @IsString({ message: 'La descripción debe ser texto' })
  @IsNotEmpty({ message: 'La descripción no puede estar vacía' })
  description: string;

  @IsNotEmpty({ message: 'La fecha programada no puede estar vacía' })
  @IsISO8601({}, { message: 'La fecha programada debe ser una fecha válida' })
  scheduledDate: Date;

  @IsISO8601({}, { message: 'La fecha de vencimiento debe ser una fecha válida' })
  @IsNotEmpty({ message: 'La fecha de vencimiento no puede estar vacía' })
  dueDate: Date;

  @IsOptional()
  @IsEnum(WorkOrderStatus, { message: 'El estado no es válido' })
  status?: WorkOrderStatus;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha de finalización debe ser una fecha válida' })
  completedDate?: Date | null;

  @IsOptional()
  @IsUUID('4', { message: 'El ID del usuario asignado debe ser un UUID válido' })
  assignedToUserId?: string;

  @IsOptional()
  @ValidateNested()
  @IsUUID('4', { each: true, message: 'Cada ID de parcela debe ser un UUID válido' })
  plotIds: string[];
}

export class UpdateWorkOrderDto {
  @IsOptional()
  @IsString({ message: 'El título debe ser texto' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  description?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha programada debe ser una fecha válida' })
  scheduledDate?: Date;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha de vencimiento debe ser una fecha válida' })
  dueDate?: Date;

  @IsOptional()
  @IsEnum(WorkOrderStatus, { message: 'El estado no es válido' })
  status?: WorkOrderStatus;

  @IsOptional()
  @IsUUID('4', { message: 'El ID del usuario asignado debe ser un UUID válido' })
  assignedToUserId?: string | null;
  
  @IsOptional()
  @ValidateNested()
  @IsUUID('4', { each: true, message: 'Cada ID de parcela debe ser un UUID válido' })
  plotIds?: string[];
}
