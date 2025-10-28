import { InputUnit } from "@/enums";
import { IsString, IsNotEmpty, IsOptional, IsEnum } from "class-validator";

export class CreateInputDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @IsEnum(InputUnit, { message: 'La unidad no es válida' })
  unit: InputUnit;
}

export class UpdateInputDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  name?: string;

  @IsOptional()
  @IsEnum(InputUnit, { message: 'La unidad no es válida' })
  unit?: InputUnit;
}
