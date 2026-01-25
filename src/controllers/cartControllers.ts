import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';


// GET CART - View user's cart with all items

export const getCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw new ValidationError('User not authenticated');
        }

        // Find user's cart (or create if doesn't exist)
        let cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                category: true // Include category info too
                            }
                        }
                    }
                }
            }
        });

        // If cart doesn't exist, create an empty one
        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId },
                include: {
                    items: {
                        include: {
                            product: {
                                include: {
                                    category: true
                                }
                            }
                        }
                    }
                }
            });
        }

        // Calculate totals
        const subtotal = cart.items.reduce((sum, item) => {
            return sum + (item.product.price * item.quantity);
        }, 0);

        const itemCount = cart.items.reduce((sum, item) => {
            return sum + item.quantity;
        }, 0);

        // Return cart with calculated values
        res.status(200).json({
            cart: {
                id: cart.id,
                items: cart.items,
                subtotal: subtotal.toFixed(2),
                itemCount,
                createdAt: cart.createdAt,
                updatedAt: cart.updatedAt
            }
        });

    } catch (error) {
        next(error);
    }
};


// ADD TO CART - Add a product to cart

export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { productId, quantity } = req.body;

        if (!userId) {
            throw new ValidationError('User not authenticated');
        }

        // 1. Check if product exists and has enough stock
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            throw new NotFoundError('Product not found');
        }

        if (product.stock < quantity) {
            throw new ValidationError(
                `Only ${product.stock} items available in stock`
            );
        }

        // 2. Find or create user's cart
        let cart = await prisma.cart.findUnique({
            where: { userId }
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId }
            });
        }

        // 3. Check if product already exists in cart
        const existingCartItem = await prisma.cartItem.findFirst({
            where: {
                cartId: cart.id,
                productId: productId
            }
        });

        let cartItem;

        if (existingCartItem) {
            // Product already in cart - update quantity
            const newQuantity = existingCartItem.quantity + quantity;

            // Check if new quantity exceeds stock
            if (newQuantity > product.stock) {
                throw new ValidationError(
                    `Cannot add ${quantity} more. Only ${product.stock - existingCartItem.quantity} items available`
                );
            }

            cartItem = await prisma.cartItem.update({
                where: { id: existingCartItem.id },
                data: {
                    quantity: newQuantity
                },
                include: {
                    product: true
                }
            });
        } else {
            // Product not in cart - create new cart item
            cartItem = await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId: productId,
                    quantity: quantity
                },
                include: {
                    product: true
                }
            });
        }

        res.status(201).json({
            message: 'Product added to cart successfully',
            cartItem
        });

    } catch (error) {
        next(error);
    }
};


// UPDATE CART ITEM - Change quantity

export const updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { itemId } = req.params;
        const { quantity } = req.body;

        if (!userId) {
            throw new ValidationError('User not authenticated');
        }

        // 1. Find cart item and verify it belongs to user
        const cartItem = await prisma.cartItem.findUnique({
            where: { id: itemId },
            include: {
                cart: true,
                product: true
            }
        });

        if (!cartItem) {
            throw new NotFoundError('Cart item not found');
        }

        if (cartItem.cart.userId !== userId) {
            throw new ValidationError('This cart item does not belong to you');
        }

        // 2. Check if requested quantity is available
        if (quantity > cartItem.product.stock) {
            throw new ValidationError(
                `Only ${cartItem.product.stock} items available in stock`
            );
        }

        // 3. Update quantity
        const updatedCartItem = await prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity },
            include: {
                product: true
            }
        });

        res.status(200).json({
            message: 'Cart item updated successfully',
            cartItem: updatedCartItem
        });

    } catch (error) {
        next(error);
    }
};


// REMOVE FROM CART - Delete a cart item

export const removeFromCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { itemId } = req.params;

        if (!userId) {
            throw new ValidationError('User not authenticated');
        }

        // 1. Find cart item and verify ownership
        const cartItem = await prisma.cartItem.findUnique({
            where: { id: itemId },
            include: {
                cart: true
            }
        });

        if (!cartItem) {
            throw new NotFoundError('Cart item not found');
        }

        if (cartItem.cart.userId !== userId) {
            throw new ValidationError('This cart item does not belong to you');
        }

        // 2. Delete the cart item
        await prisma.cartItem.delete({
            where: { id: itemId }
        });

        res.status(200).json({
            message: 'Item removed from cart successfully'
        });

    } catch (error) {
        next(error);
    }
};


// CLEAR CART - Remove all items from cart

export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw new ValidationError('User not authenticated');
        }

        // 1. Find user's cart
        const cart = await prisma.cart.findUnique({
            where: { userId }
        });

        if (!cart) {
            throw new NotFoundError('Cart not found');
        }

        // 2. Delete all cart items
        await prisma.cartItem.deleteMany({
            where: { cartId: cart.id }
        });

        res.status(200).json({
            message: 'Cart cleared successfully'
        });

    } catch (error) {
        next(error);
    }
};


// GET CART SUMMARY - Quick cart info

export const getCartSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw new ValidationError('User not authenticated');
        }

        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!cart) {
            return res.status(200).json({
                itemCount: 0,
                subtotal: 0
            });
        }

        const subtotal = cart.items.reduce((sum, item) => {
            return sum + (item.product.price * item.quantity);
        }, 0);

        const itemCount = cart.items.reduce((sum, item) => {
            return sum + item.quantity;
        }, 0);

        res.status(200).json({
            itemCount,
            subtotal: subtotal.toFixed(2)
        });

    } catch (error) {
        next(error);
    }
};