import { MinLength, IsNotEmpty, IsString } from "class-validator";

export class CreateFieldDto {
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  name: string;
}

export class UpdateFieldDto {
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
  name?: string;
}
