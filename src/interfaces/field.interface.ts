export interface IField {
  id?: number;
  name: string;
  location: string; // GeoJSON or address
  totalArea: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
