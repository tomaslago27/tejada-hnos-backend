import { IsNotEmpty, IsNumber, IsUUID, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { LocationDto } from './location.dto';

export class CreatePlotDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsNumber()
  @IsNotEmpty()
  readonly area: number;

  @IsString()
  @IsOptional()
  readonly variety?: string;

  readonly fieldId: string;

  @ValidateNested()
  @Type(() => LocationDto)
  readonly location: LocationDto;
}

export class UpdatePlotDto {
  @IsString()
  @IsOptional()
  readonly name?: string;

  @IsNumber()
  @IsOptional()
  readonly area?: number;

  @IsString()
  @IsOptional()
  readonly variety?: string;

  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  readonly location?: LocationDto;
}
