import { IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { LocationDto } from './location.dto';

export class CreatePlotDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @IsNumber({}, { message: 'El área debe ser un número' })
  @IsNotEmpty({ message: 'El área es obligatoria' })
  area: number;

  @IsUUID('4', { message: 'El ID de la variedad debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID de la variedad no puede estar vacío' })
  varietyId: string;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha de plantación debe ser una fecha válida' })
  datePlanted?: Date;

  // fieldId viene de la URL (params) y se agrega en el controller/middleware
  @IsNotEmpty({ message: 'El ID del campo es obligatorio' })
  @IsUUID('4', { message: 'El ID del campo debe ser un UUID válido' })
  fieldId: string;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;
}

export class UpdatePlotDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  name?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El área debe ser un número' })
  area?: number;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de la variedad debe ser un UUID válido' })
  varietyId?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha de plantación debe ser una fecha válida' })
  datePlanted?: Date;

  @IsOptional()
  @IsUUID('4', { message: 'El ID del campo debe ser un UUID válido' })
  fieldId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}
