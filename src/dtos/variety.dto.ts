import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateVarietyDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  name: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  description?: string;
}

export class UpdateVarietyDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  description?: string;
}
