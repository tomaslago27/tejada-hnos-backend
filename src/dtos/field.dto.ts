import { MinLength, IsNotEmpty, IsString, ValidateNested, IsNumber, IsOptional, IsUUID } from "class-validator";
import { Type } from "class-transformer";
import { LocationDto } from "./location.dto";

export class CreateFieldDto {
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'La dirección es obligatoria.' })
  address: string;

  @IsNumber()
  @IsNotEmpty({ message: 'El tamaño es obligatorio.' })
  area: number;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsOptional()
  @IsUUID('4', { message: 'El ID del encargado debe ser un UUID válido' })
  managerId?: string;
}

export class UpdateFieldDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  area?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsOptional()
  @IsUUID('4', { message: 'El ID del encargado debe ser un UUID válido' })
  managerId?: string;
}
