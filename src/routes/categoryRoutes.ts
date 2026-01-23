import { Router } from 'express';
import {
    getCategories,
    getCategoryById,
    getProductsByCategory,
    createCategory,
    updateCategory,
    deleteCategory
} from '../controllers/categoryControllers.js';
import { authenticate } from '../middleware/authMiddlewares.js';
import { authorize } from '../middleware/authMiddlewares.js';

const router = Router();

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.get('/:id/products', getProductsByCategory);

// Protected routes (Admin only)
router.post('/', authenticate, authorize('ADMIN'), createCategory);
router.put('/:id', authenticate, authorize('ADMIN'), updateCategory);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCategory);

export default router;
