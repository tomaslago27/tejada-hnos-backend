import { IsEnum, IsNotEmpty, IsISO8601, IsOptional, IsNumber, IsUUID, ValidateNested, IsArray } from "class-validator";
import { ActivityType, ActivityStatus } from "@/enums";
import { Type } from "class-transformer";
import { CreateInputUsageDto } from "./input-usage.dto";

export class CreateActivityDto {
  // workOrderId viene de la URL (params) y se agrega en el controller/middleware
  @IsNotEmpty({ message: 'El ID de la orden de trabajo es obligatorio' })
  @IsUUID('4', { message: 'El ID de la orden de trabajo debe ser un UUID válido' })
  workOrderId: string;

  @IsNotEmpty({ message: 'El tipo de actividad no puede estar vacío' })
  @IsEnum(ActivityType, { message: 'El tipo de actividad no es válido' })
  type: ActivityType;

  @IsOptional()
  @IsEnum(ActivityStatus, { message: 'El estado de la actividad no es válido' })
  status?: ActivityStatus;

  @IsNotEmpty({ message: 'La fecha de ejecución no puede estar vacía' })
  @IsISO8601({}, { message: 'La fecha de ejecución debe ser una fecha válida' })
  executionDate: Date;

  @IsNotEmpty({ message: 'Las horas trabajadas no pueden estar vacías' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Las horas trabajadas deben ser un número válido' })
  hoursWorked: number;

  @IsOptional()
  details?: any;

  @IsOptional()
  @IsArray({ message: 'Los insumos utilizados deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreateInputUsageDto)
  inputsUsed?: CreateInputUsageDto[];
}

export class UpdateActivityDto {
  @IsOptional()
  @IsEnum(ActivityType, { message: 'El tipo de actividad no es válido' })
  type?: ActivityType;

  @IsOptional()
  @IsEnum(ActivityStatus, { message: 'El estado de la actividad no es válido' })
  status?: ActivityStatus;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha de ejecución debe ser una fecha válida' })
  executionDate?: Date;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Las horas trabajadas deben ser un número válido' })
  hoursWorked?: number;

  @IsOptional()
  details?: any;

  @IsOptional()
  @IsArray({ message: 'Los insumos utilizados deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreateInputUsageDto)
  inputsUsed?: CreateInputUsageDto[];
}
