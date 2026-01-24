import { Router } from 'express';
import {
    getCategories,
    getCategoryById,
    getProductsByCategory,
    createCategory,
    updateCategory,
    deleteCategory
} from '../controllers/categoryControllers.js';
import { authenticate, authorize } from '../middleware/authMiddlewares.js';
import { validate } from '../middleware/validate.js';
import {
    createCategorySchema,
    updateCategorySchema,
    categoryIdSchema,
    paginationSchema,
    categoryFilterSchema
} from '../config/validationSchemas.js';

const router = Router();

// Public routes with validation
router.get('/', validate(categoryFilterSchema), getCategories);
router.get('/:id', validate(categoryIdSchema), getCategoryById);
router.get('/:id/products', validate(categoryIdSchema), validate(paginationSchema), getProductsByCategory);

// Protected routes (Admin only) with validation
router.post(
    '/',
    authenticate,
    authorize('ADMIN'),
    validate(createCategorySchema),
    createCategory
);

router.put(
    '/:id',
    authenticate,
    authorize('ADMIN'),
    validate(updateCategorySchema),
    updateCategory
);

router.delete(
    '/:id',
    authenticate,
    authorize('ADMIN'),
    validate(categoryIdSchema),
    deleteCategory
);

export default router;
