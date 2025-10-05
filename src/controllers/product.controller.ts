import { Request, Response } from 'express';
import { ProductService } from '@services/product.service';
import { IProductData } from '@interfaces/product.interface';

type DatabaseSource = 'mysql' | 'mongodb';

export class ProductController {
    private productService: ProductService;

    constructor() {
        this.productService = new ProductService();
    }

    // Obtener productos de ambas bases de datos
    async getAllProducts(req: Request, res: Response) {
        try {
            const { source } = req.query;
            let products;

            if (source === 'mysql') {
                products = await this.productService.getAllFromMySQL();
            } else if (source === 'mongodb') {
                products = await this.productService.getAllFromMongoDB();
            } else {
                // Si no se especifica la fuente, obtener de ambas bases de datos
                const [mysqlProducts, mongoProducts] = await Promise.all([
                    this.productService.getAllFromMySQL(),
                    this.productService.getAllFromMongoDB()
                ]);

                products = {
                    mysql: mysqlProducts,
                    mongodb: mongoProducts
                };
            }

            res.json(products);
        } catch (error) {
            res.status(500).json({ error: 'Error getting products' });
        }
    }

    // Crear un producto en una base de datos específica
    async createProduct(req: Request, res: Response) {
        try {
            const source = req.query.source as DatabaseSource;
            const productData = req.body as IProductData;

            if (!source || (source !== 'mysql' && source !== 'mongodb')) {
                return res.status(400).json({ error: 'Invalid source specified' });
            }

            const product = source === 'mysql'
                ? await this.productService.createInMySQL(productData)
                : await this.productService.createInMongoDB(productData);

            res.status(201).json(product);
        } catch (error) {
            res.status(500).json({ error: 'Error creating product' });
        }
    }

    // Obtener un producto por código
    async getProductByCode(req: Request, res: Response) {
        try {
            const code = req.params.code;
            const source = req.query.source as DatabaseSource;

            if (!code) {
                return res.status(400).json({ error: 'Product code is required' });
            }

            if (!source || (source !== 'mysql' && source !== 'mongodb')) {
                return res.status(400).json({ error: 'Invalid source specified' });
            }

            const product = source === 'mysql'
                ? await this.productService.getFromMySQL(code)
                : await this.productService.getFromMongoDB(code);

            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            res.json(product);
        } catch (error) {
            res.status(500).json({ error: 'Error getting product' });
        }
    }
}
