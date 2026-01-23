import { Router } from 'express';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} from '../controllers/productControllers.js';
import { authenticate } from '../middleware/authMiddlewares.js';
import { authorize } from '../middleware/authMiddlewares.js';

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected routes (Admin only)
router.post('/', authenticate, authorize('ADMIN'), createProduct);
router.put('/:id', authenticate, authorize('ADMIN'), updateProduct);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteProduct);

export default router;