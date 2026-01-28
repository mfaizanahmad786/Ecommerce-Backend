import { Router } from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderStats
} from '../controllers/orderControllers.js';
import { authenticate, authorize } from '../middleware/authMiddlewares.js';
import { validate } from '../middleware/validate.js';
import {
  createOrderSchema,
  orderIdSchema,
  orderFilterSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema
} from '../config/validationSchemas.js';

const router = Router();

// All order routes require authentication
router.use(authenticate);

// ============================================
// USER ROUTES
// ============================================

// Get user's order history
router.get('/my-orders', validate(orderFilterSchema), getUserOrders);

// Get specific order by ID
router.get('/:id', validate(orderIdSchema), getOrderById);

// Create order (checkout)
router.post('/', validate(createOrderSchema), createOrder);

// Cancel order
router.put('/:id/cancel', validate(orderIdSchema), cancelOrder);

// ============================================
// ADMIN ROUTES
// ============================================

// Get order statistics (admin only)
router.get('/admin/stats', authorize('ADMIN'), getOrderStats);

// Get all orders (admin only)
router.get('/admin/all', authorize('ADMIN'), validate(orderFilterSchema), getAllOrders);

// Update order status (admin only)
router.put(
  '/admin/:id/status',
  authorize('ADMIN'),
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

// Update payment status (admin only)
router.put(
  '/admin/:id/payment',
  authorize('ADMIN'),
  validate(updatePaymentStatusSchema),
  updatePaymentStatus
);

export default router;
