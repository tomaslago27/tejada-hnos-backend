export interface IPlot {
  id: string;
  name: string; // Ej: "Parcela A-01"
  area: number; // En hectáreas
  variety?: string; // Ej: "Chandler"
  // GeoJSON para la ubicación en el mapa
  location: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  fieldId: string;
  createdAt: Date;
  updatedAt: Date;
}
