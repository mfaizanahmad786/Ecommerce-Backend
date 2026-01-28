import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';

// ============================================
// CREATE ORDER - Checkout (Cart → Order)
// ============================================
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { shippingAddress, paymentMethod } = req.body;

        if (!userId) {
            throw new ValidationError('User not authenticated');
        }

        // STEP 1: Get user's cart with all items
        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true // Include product details
                    }
                }
            }
        });

        // Check if cart exists and has items
        if (!cart || cart.items.length === 0) {
            throw new ValidationError('Cart is empty. Add items before checkout.');
        }

        // STEP 2: Validate stock for ALL items
        for (const item of cart.items) {
            if (item.product.stock < item.quantity) {
                throw new ValidationError(
                    `${item.product.name} only has ${item.product.stock} items in stock. You tried to order ${item.quantity}.`
                );
            }
        }

        // STEP 3: Calculate total amount
        const total = cart.items.reduce((sum, item) => {
            return sum + (item.product.price * item.quantity);
        }, 0);

        // STEP 4: Create order with items in a TRANSACTION
        // (All operations succeed together or all fail together)
        const order = await prisma.$transaction(async (tx) => {
            // Create the order
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    total,
                    shippingAddress,
                    paymentMethod,
                    status: 'PENDING',
                    paymentStatus: 'PENDING',
                    // Create OrderItems from CartItems
                    items: {
                        create: cart.items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.product.price // Store current price!
                        }))
                    }
                },
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

            // Reduce product stock for each item
            for (const item of cart.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            decrement: item.quantity // Reduce stock
                        }
                    }
                });
            }

            // Clear the cart (delete all cart items)
            await tx.cartItem.deleteMany({
                where: { cartId: cart.id }
            });

            return newOrder;
        });

        res.status(201).json({
            message: 'Order placed successfully! 🎉',
            order
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// GET USER'S ORDER HISTORY
// ============================================
export const getUserOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { status, page = '1', limit = '10' } = req.query;

        if (!userId) {
            throw new ValidationError('User not authenticated');
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Build filter
        const where: any = { userId };
        if (status) {
            where.status = status;
        }

        // Get orders with pagination
        const orders = await prisma.order.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: {
                createdAt: 'desc' // Newest first
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                images: true
                            }
                        }
                    }
                }
            }
        });

        const total = await prisma.order.count({ where });

        res.status(200).json({
            orders,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// GET SINGLE ORDER BY ID
// ============================================
export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const id = req.params.id as string;

        if (!userId) {
            throw new ValidationError('User not authenticated');
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                category: true
                            }
                        }
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        if (!order) {
            throw new NotFoundError('Order not found');
        }

        // Security: User can only view their own orders (unless admin)
        if (order.userId !== userId && req.user?.role !== 'ADMIN') {
            throw new ValidationError('You can only view your own orders');
        }

        res.status(200).json(order);

    } catch (error) {
        next(error);
    }
};

// ============================================
// CANCEL ORDER (User)
// ============================================
export const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const id = req.params.id as string;

        if (!userId) {
            throw new ValidationError('User not authenticated');
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: true
            }
        });

        if (!order) {
            throw new NotFoundError('Order not found');
        }

        // Security: User can only cancel their own orders
        if (order.userId !== userId) {
            throw new ValidationError('You can only cancel your own orders');
        }

        // Business rule: Can only cancel if PENDING or PROCESSING
        if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
            throw new ValidationError('Cannot cancel order that is already shipped or delivered');
        }

        if (order.status === 'CANCELLED') {
            throw new ValidationError('Order is already cancelled');
        }

        // Cancel order and restore stock in a transaction
        const cancelledOrder = await prisma.$transaction(async (tx) => {
            // Update order status to CANCELLED
            const updated = await tx.order.update({
                where: { id },
                data: {
                    status: 'CANCELLED'
                },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            });

            // Restore product stock
            for (const item of order.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            increment: item.quantity // Add back to stock
                        }
                    }
                });
            }

            return updated;
        });

        res.status(200).json({
            message: 'Order cancelled successfully. Stock has been restored.',
            order: cancelledOrder
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// ADMIN: GET ALL ORDERS
// ============================================
export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status, userId, page = '1', limit = '10' } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Build filter
        const where: any = {};
        if (status) {
            where.status = status;
        }
        if (userId) {
            where.userId = userId;
        }

        const orders = await prisma.order.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                images: true
                            }
                        }
                    }
                }
            }
        });

        const total = await prisma.order.count({ where });

        res.status(200).json({
            orders,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// ADMIN: UPDATE ORDER STATUS
// ============================================
export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        const { status } = req.body;

        const order = await prisma.order.findUnique({
            where: { id }
        });

        if (!order) {
            throw new NotFoundError('Order not found');
        }

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { status },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        res.status(200).json({
            message: `Order status updated to ${status}`,
            order: updatedOrder
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// ADMIN: UPDATE PAYMENT STATUS
// ============================================
export const updatePaymentStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        const { paymentStatus } = req.body;

        const order = await prisma.order.findUnique({
            where: { id }
        });

        if (!order) {
            throw new NotFoundError('Order not found');
        }

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { paymentStatus },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        res.status(200).json({
            message: `Payment status updated to ${paymentStatus}`,
            order: updatedOrder
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// ADMIN: GET ORDER STATISTICS
// ============================================
export const getOrderStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        // Total orders
        const totalOrders = await prisma.order.count();

        // Orders by status
        const ordersByStatus = await prisma.order.groupBy({
            by: ['status'],
            _count: {
                status: true
            }
        });

        // Total revenue (only delivered orders)
        const revenueData = await prisma.order.aggregate({
            where: { status: 'DELIVERED' },
            _sum: {
                total: true
            }
        });

        const totalRevenue = revenueData._sum?.total || 0;

        // Recent orders
        const recentOrders = await prisma.order.findMany({
            take: 5,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        res.status(200).json({
            totalOrders,
            ordersByStatus,
            totalRevenue: totalRevenue.toFixed(2),
            recentOrders
        });

    } catch (error) {
        next(error);
    }
};