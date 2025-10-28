import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from "class-validator";

export class CreateInputUsageDto {
  @IsNotEmpty({ message: 'La cantidad utilizada es obligatoria' })
  @IsNumber({}, { message: 'La cantidad utilizada debe ser un número válido' })
  quantityUsed: number;

  @IsNotEmpty({ message: 'El ID de la actividad es obligatorio' })
  @IsUUID('4', { message: 'El ID de la actividad debe ser un UUID válido' })
  activityId: string;

  @IsNotEmpty({ message: 'El ID del insumo es obligatorio' })
  @IsUUID('4', { message: 'El ID del insumo debe ser un UUID válido' })
  inputId: string;
}

export class UpdateInputUsageDto {
  @IsOptional()
  @IsNumber({}, { message: 'La cantidad utilizada debe ser un número válido' })
  quantityUsed?: number;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de la actividad debe ser un UUID válido' })
  activityId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID del insumo debe ser un UUID válido' })
  inputId?: string;
}
