import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary,
} from '../controllers/cartControllers';
import { authenticate } from '../middleware/authMiddlewares';
import { validate } from '../middleware/validate';
import {
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
} from '../config/validationSchemas';

const router = Router();

// All cart routes require authentication
router.use(authenticate);

// Get user's cart
router.get('/', getCart);

// Get cart summary (for navbar badge)
router.get('/summary', getCartSummary);

// Add item to cart
router.post('/add', validate(addToCartSchema), addToCart);

// Update cart item quantity
router.put('/item/:itemId', validate(updateCartItemSchema), updateCartItem);

// Remove item from cart
router.delete('/item/:itemId', validate(removeCartItemSchema), removeFromCart);

// Clear entire cart
router.delete('/clear', clearCart);

export default router;
