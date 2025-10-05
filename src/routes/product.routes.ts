import { Router } from 'express';
import { ProductController } from '@controllers/product.controller';

const router = Router();
const productController = new ProductController();

// Obtener todos los productos
router.get('/', (req, res) => productController.getAllProducts(req, res));

// Crear un nuevo producto
router.post('/', (req, res) => productController.createProduct(req, res));

// Obtener un producto por código
router.get('/:code', (req, res) => productController.getProductByCode(req, res));

export default router;
