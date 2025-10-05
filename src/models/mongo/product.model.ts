import { IMongoProduct } from '@interfaces/product.interface';
import { Schema, model } from 'mongoose';

const productSchema = new Schema<IMongoProduct>(
    {
        code: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        stock: { type: Number, default: 0 }
    },
    { 
        timestamps: true // Esto agregará automáticamente createdAt y updatedAt
    }
);

export const MongoProduct = model<IMongoProduct>('Product', productSchema);
