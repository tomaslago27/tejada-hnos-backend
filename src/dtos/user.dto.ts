import { UserRole } from "@/enums";
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";

export class CreateUserDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  email: string;

  @IsString({ message: 'La contraseña es requerida.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password: string;

  @IsString({ message: 'El nombre es requerido.' })
  name: string;

  @IsString({ message: 'El apellido es requerido.' })
  lastName: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Rol inválido.' })
  role?: UserRole;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'La tarifa por hora debe ser un número.' })
  @Min(0, { message: 'La tarifa por hora no puede ser negativa.' })
  hourlyRate?: number;
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'El nombre es requerido.' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'El apellido es requerido.' })
  lastName?: string;

  @IsOptional()
  @IsString({ message: 'La contraseña es requerida.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Rol inválido.' })
  role?: UserRole;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'La tarifa por hora debe ser un número.' })
  @Min(0, { message: 'La tarifa por hora no puede ser negativa.' })
  hourlyRate?: number;
}

export class UserPasswordUpdateDto {
  @IsString({ message: 'La contraseña actual es requerida.' })
  currentPassword: string;

  @IsString({ message: 'La nueva contraseña es requerida.' })
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres.' })
  newPassword: string;
}

export class UserLoginDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  email: string;

  @IsString({ message: 'La contraseña es requerida.' })
  password: string;
}

export class UserTokenRefreshDto {
  @IsString({ message: 'El refresh token es requerido.' })
  refreshToken: string;
}
