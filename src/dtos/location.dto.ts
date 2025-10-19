import { IsArray, ArrayNotEmpty, ValidateNested, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

// Para simplificar, asumimos que cada punto es un array de dos números: [longitude, latitude]
class CoordinatePair {
    @IsArray()
    @ArrayNotEmpty()
    @Type(() => Number)
    @IsIn([2], { each: true, message: 'Coordinate must be a pair [lng, lat]' })
    readonly coordinates: number[];
}

// Representa el anillo exterior del Polígono
class PolygonRing {
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => CoordinatePair)
    readonly ring: CoordinatePair[]; 
}

// DTO completo para la columna 'location' (JSONB)
export class LocationDto {
    @IsString()
    @IsIn(['Polygon'])
    readonly type: 'Polygon';

    // 'coordinates' es un array de arrays de pares de coordenadas (number[][][])
    // Un polígono simple tiene solo un elemento en el array: el anillo exterior
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => PolygonRing)
    readonly coordinates: PolygonRing[]; 
}
