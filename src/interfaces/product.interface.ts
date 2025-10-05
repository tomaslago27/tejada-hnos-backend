import { Document } from 'mongoose';

// Interfaz base para los datos del producto
export interface IProductData {
    code: string;
    name: string;
    price: number;
    stock: number;
}

// Interfaz para el documento de Mongoose que incluye los campos adicionales
export interface IMongoProduct extends IProductData, Document {
    createdAt: Date;
    updatedAt: Date;
}
