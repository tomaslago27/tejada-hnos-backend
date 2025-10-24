// src/types.ts
import { ActivityType } from '@/enums';

/** Estructura estándar para un polígono GeoJSON */
export type GeoJSONPolygon = {
  type: 'Polygon';
  coordinates: number[][][]; // Array de anillos [long, lat]
};

// --- Definiciones para el campo `details` de la entidad Activity ---

// Si la actividad es PODA
type PodaDetails = {
  tipo: 'FORMACION' | 'PRODUCCION' | 'LIMPIEZA';
};

// Si la actividad es RIEGO
type RiegoDetails = {
  duracionHoras: number;
  metodo: 'GOTEO' | 'MANTO' | 'ASPERSION';
};

// Si la actividad es APLICACION
type AplicacionDetails = {
  maquinaria: string;
  condicionesClimaticas: string; // Ej: "Viento leve, 20°C"
};
// Nota: los insumos y dosis NO van aquí,
// van en la entidad `InputUsage`

// Si la actividad es COSECHA
type CosechaDetails = {
  maquinaria: string; // Ej: "Vibrador XYZ"
};

/**
 * Un tipo de unión discriminada para `Activity.details`.
 * Dependiendo del valor de `Activity.type`, TypeScript
 * sabrá qué campos esperar en `details`.
 */
export type ActivityDetails =
  | { type: ActivityType.PODA; details: PodaDetails }
  | { type: ActivityType.RIEGO; details: RiegoDetails }
  | { type: ActivityType.APLICACION; details: AplicacionDetails }
  | { type: ActivityType.COSECHA; details: CosechaDetails }
  | { type: ActivityType.MANTENIMIENTO; details: { descripcion: string } }
  | { type: ActivityType.MONITOREO; details: { resultado: string } }
  | { type: ActivityType.OTRO; details: { descripcion: string } };
