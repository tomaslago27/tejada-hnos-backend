import { HarvestLotStatus, WalnutCaliber } from "@/enums";
import { IsEnum, IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreateHarvestLotDto {
  // plotId puede venir de la URL o del body dependiendo del endpoint
  @IsOptional()
  @IsUUID('4', { message: 'El ID de la parcela debe ser un UUID válido' })
  plotId?: string;

  @IsNotEmpty({ message: 'La fecha de cosecha es obligatoria' })
  @IsISO8601({}, { message: 'La fecha de cosecha debe ser una fecha válida' })
  harvestDate: Date;

  @IsString({ message: 'El código de lote debe ser texto' })
  @IsNotEmpty({ message: 'El código de lote no puede estar vacío' })
  lotCode: string;

  @IsString({ message: 'El nombre de la variedad debe ser texto' })
  @IsNotEmpty({ message: 'El nombre de la variedad no puede estar vacío' })
  varietyName: string;

  @IsOptional()
  @IsEnum(WalnutCaliber, { message: 'El calibre no es válido' })
  caliber?: WalnutCaliber;

  @IsNotEmpty({ message: 'El peso bruto es obligatorio' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El peso bruto debe ser un número válido' })
  @Min(0.01, { message: 'El peso bruto debe ser mayor a 0' })
  grossWeightKg: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El peso neto debe ser un número válido' })
  @Min(0, { message: 'El peso neto no puede ser negativo' })
  netWeightKg?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El porcentaje de rendimiento debe ser un número válido' })
  @Min(0, { message: 'El porcentaje de rendimiento no puede ser negativo' })
  yieldPercentage?: number;

  @IsOptional()
  @IsEnum(HarvestLotStatus, { message: 'El estado no es válido' })
  status?: HarvestLotStatus;
}

export class UpdateHarvestLotDto {
  @IsOptional()
  @IsUUID('4', { message: 'El ID de la parcela debe ser un UUID válido' })
  plotId?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha de cosecha debe ser una fecha válida' })
  harvestDate?: Date;

  @IsOptional()
  @IsString({ message: 'El código de lote debe ser texto' })
  lotCode?: string;

  @IsOptional()
  @IsString({ message: 'El nombre de la variedad debe ser texto' })
  varietyName?: string;

  @IsOptional()
  @IsEnum(WalnutCaliber, { message: 'El calibre no es válido' })
  caliber?: WalnutCaliber;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El peso bruto debe ser un número válido' })
  @Min(0.01, { message: 'El peso bruto debe ser mayor a 0' })
  grossWeightKg?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El peso neto debe ser un número válido' })
  @Min(0, { message: 'El peso neto no puede ser negativo' })
  netWeightKg?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El porcentaje de rendimiento debe ser un número válido' })
  @Min(0, { message: 'El porcentaje de rendimiento no puede ser negativo' })
  yieldPercentage?: number;

  @IsOptional()
  @IsEnum(HarvestLotStatus, { message: 'El estado no es válido' })
  status?: HarvestLotStatus;
}
