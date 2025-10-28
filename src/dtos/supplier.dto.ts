import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateSupplierDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  name: string;

  @IsOptional()
  @IsString({ message: 'El CUIL/CUIT debe ser texto' })
  taxId?: string;

  @IsOptional()
  @IsString({ message: 'La dirección debe ser texto' })
  address?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo de contacto no es válido' })
  contactEmail?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  phoneNumber?: string;
}

export class UpdateSupplierDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'El CUIL/CUIT debe ser texto' })
  taxId?: string;

  @IsOptional()
  @IsString({ message: 'La dirección debe ser texto' })
  address?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo de contacto no es válido' })
  contactEmail?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  phoneNumber?: string;
}
