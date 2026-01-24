import { Router } from 'express';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} from '../controllers/productControllers.js';
import { authenticate, authorize } from '../middleware/authMiddlewares.js';
import { validate } from '../middleware/validate.js';
import {
    createProductSchema,
    updateProductSchema,
    productIdSchema,
    paginationSchema,
    productFilterSchema
} from '../config/validationSchemas.js';

const router = Router();

// Public routes with validation
router.get('/', validate(paginationSchema), validate(productFilterSchema), getProducts);
router.get('/:id', validate(productIdSchema), getProductById);

// Protected routes (Admin only) with validation
router.post(
    '/',
    authenticate,
    authorize('ADMIN'),
    validate(createProductSchema),
    createProduct
);

router.put(
    '/:id',
    authenticate,
    authorize('ADMIN'),
    validate(updateProductSchema),
    updateProduct
);

router.delete(
    '/:id',
    authenticate,
    authorize('ADMIN'),
    validate(productIdSchema),
    deleteProduct
);

export default router;