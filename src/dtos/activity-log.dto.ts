import { IsString, IsNotEmpty, IsDateString, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ActivityType } from '@/enums';

export class CreateActivityLogDto {
    @IsEnum(ActivityType, { message: 'El tipo de actividad no es válido' })
    @IsNotEmpty({ message: 'El tipo de actividad no puede estar vacío' })
    activityType: ActivityType;

    @IsString({ message: 'La descripción debe ser texto' })
    @IsNotEmpty({ message: 'La descripción no puede estar vacía' })
    description: string;

    @IsDateString({}, { message: 'La fecha de ejecución debe ser una fecha válida' })
    @IsNotEmpty({ message: 'La fecha de ejecución не puede estar vacía' })
    executionDate: Date;

    @IsUUID('4', { message: 'El ID de la parcela debe ser un UUID válido' })
    @IsNotEmpty({ message: 'El ID de la parcela no puede estar vacío' })
    plotId: string;

    // Nota: No se valida createdByUserId aquí porque se lo tomará del usuario autenticado.
}

export class UpdateActivityLogDto {
    @IsOptional()
    @IsEnum(ActivityType, { message: 'El tipo de actividad no es válido' })
    activityType?: ActivityType;

    @IsOptional()
    @IsString({ message: 'La descripción debe ser texto' })
    description?: string;

    @IsOptional()
    @IsDateString({}, { message: 'La fecha de ejecución debe ser una fecha válida' })
    executionDate?: Date;

    @IsOptional()
    @IsUUID('4', { message: 'El ID de la parcela debe ser un UUID válido' })
    plotId?: string;
}