import { Repository } from 'typeorm';
import { MySQLDataSource } from '@config/typeorm.config';
import { MySQLProduct } from '@models/mysql/product.model';
import { MongoProduct } from '@models/mongo/product.model';
import { IProductData, IMongoProduct } from '@interfaces/product.interface';

export class ProductService {
    private mysqlRepository: Repository<MySQLProduct>;

    constructor() {
        this.mysqlRepository = MySQLDataSource.getRepository(MySQLProduct);
    }

    // Método para crear un producto en MySQL
    async createInMySQL(productData: IProductData): Promise<MySQLProduct> {
        const product = this.mysqlRepository.create(productData);
        return await this.mysqlRepository.save(product);
    }

    // Método para crear un producto en MongoDB
    async createInMongoDB(productData: IProductData): Promise<IMongoProduct> {
        const product = new MongoProduct(productData);
        return await product.save();
    }

    // Método para obtener un producto por código de MySQL
    async getFromMySQL(code: string): Promise<MySQLProduct | null> {
        return await this.mysqlRepository.findOne({ where: { code } });
    }

    // Método para obtener un producto por código de MongoDB
    async getFromMongoDB(code: string): Promise<IMongoProduct | null> {
        return await MongoProduct.findOne({ code }).exec();
    }

    // Método para obtener todos los productos de MySQL
    async getAllFromMySQL(): Promise<MySQLProduct[]> {
        return await this.mysqlRepository.find();
    }

    // Método para obtener todos los productos de MongoDB
    async getAllFromMongoDB(): Promise<IMongoProduct[]> {
        return await MongoProduct.find().exec();
    }

    // Método para actualizar un producto en MySQL
    async updateInMySQL(code: string, productData: Partial<MySQLProduct>) {
        const product = await this.mysqlRepository.findOne({ where: { code } });
        if (!product) {
            throw new Error('Product not found in MySQL');
        }
        
        Object.assign(product, productData);
        return await this.mysqlRepository.save(product);
    }

    // Método para actualizar un producto en MongoDB
    async updateInMongoDB(code: string, productData: Partial<MySQLProduct>) {
        const product = await MongoProduct.findOneAndUpdate(
            { code },
            { $set: productData },
            { new: true }
        );
        
        if (!product) {
            throw new Error('Product not found in MongoDB');
        }
        
        return product;
    }

    // Método para eliminar un producto de MySQL
    async deleteFromMySQL(code: string) {
        const product = await this.mysqlRepository.findOne({ where: { code } });
        if (!product) {
            throw new Error('Product not found in MySQL');
        }
        
        await this.mysqlRepository.remove(product);
        return true;
    }

    // Método para eliminar un producto de MongoDB
    async deleteFromMongoDB(code: string) {
        const result = await MongoProduct.deleteOne({ code });
        if (result.deletedCount === 0) {
            throw new Error('Product not found in MongoDB');
        }
        
        return true;
    }
}
