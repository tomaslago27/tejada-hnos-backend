import { IsArray, ArrayNotEmpty, IsString, IsIn, Validate, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

/**
 * Custom validator to ensure coordinates follow GeoJSON Polygon structure:
 * coordinates: Array< ring: Array< position: [number, number] > >
 */
@ValidatorConstraint({ name: 'isPolygonCoordinates', async: false })
class IsPolygonCoordinatesConstraint implements ValidatorConstraintInterface {
    validate(value: any, _args: ValidationArguments) {
        if (!Array.isArray(value) || value.length === 0) return false;

        // Each ring should be a non-empty array
        for (const ring of value) {
            if (!Array.isArray(ring) || ring.length === 0) return false;

            // Each position in ring should be an array of exactly two numbers
            for (const pos of ring) {
                if (!Array.isArray(pos) || pos.length !== 2) return false;
                const [lng, lat] = pos;
                if (typeof lng !== 'number' || typeof lat !== 'number' || Number.isNaN(lng) || Number.isNaN(lat)) return false;
            }
        }

        return true;
    }

    defaultMessage(_args: ValidationArguments) {
        return 'coordinates must be an array of linear rings, each ring an array of coordinate pairs [lng, lat] (numbers)';
    }
}

// DTO completo para la columna 'location' (GeoJSON Polygon)
export class LocationDto {
    @IsString({ message: 'type must be a string' })
    @IsIn(['Polygon'], { message: "type must be 'Polygon'" })
    readonly type: 'Polygon';

    @IsArray({ message: 'coordinates must be an array' })
    @ArrayNotEmpty({ message: 'coordinates must not be empty' })
    @Validate(IsPolygonCoordinatesConstraint)
    readonly coordinates: any[]; // number[][][] (validated by custom constraint)
}
