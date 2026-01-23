import { Request, Response } from 'express';
import prisma from '../config/database.js';

// Get all categories
export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { products: true }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.status(200).json(categories);
    } catch (e) {
        console.error('Get categories error:', e);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};

// Get category by ID
export const getCategoryById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                products: true,
                _count: {
                    select: { products: true }
                }
            }
        });

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.status(200).json(category);
    } catch (e) {
        console.error('Get category error:', e);
        res.status(500).json({ error: 'Failed to fetch category' });
    }
};

// Get products by category
export const getProductsByCategory = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const {
            page = '1',
            limit = '10',
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id }
        });

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Pagination
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Fetch products in category
        const products = await prisma.product.findMany({
            where: {
                categoryId: id
            },
            skip,
            take: limitNum,
            orderBy: {
                [sortBy as string]: order as 'asc' | 'desc'
            },
            include: {
                category: true
            }
        });

        // Get total count
        const total = await prisma.product.count({
            where: { categoryId: id }
        });

        res.status(200).json({
            category: category.name,
            products,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (e) {
        console.error('Get products by category error:', e);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

// Create category (Admin only)
export const createCategory = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        // Check if category already exists
        const existingCategory = await prisma.category.findUnique({
            where: { name }
        });

        if (existingCategory) {
            return res.status(409).json({ error: 'Category already exists' });
        }

        const category = await prisma.category.create({
            data: { name }
        });

        res.status(201).json({
            message: 'Category created successfully',
            category
        });
    } catch (e) {
        console.error('Create category error:', e);
        res.status(500).json({ error: 'Failed to create category' });
    }
};

// Update category (Admin only)
export const updateCategory = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        // Check if category exists
        const existingCategory = await prisma.category.findUnique({
            where: { id }
        });

        if (!existingCategory) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Check if new name already exists
        const duplicateCategory = await prisma.category.findUnique({
            where: { name }
        });

        if (duplicateCategory && duplicateCategory.id !== id) {
            return res.status(409).json({ error: 'Category name already exists' });
        }

        const category = await prisma.category.update({
            where: { id },
            data: { name }
        });

        res.status(200).json({
            message: 'Category updated successfully',
            category
        });
    } catch (e) {
        console.error('Update category error:', e);
        res.status(500).json({ error: 'Failed to update category' });
    }
};

// Delete category (Admin only)
export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Check if category has products
        if (category._count.products > 0) {
            return res.status(400).json({
                error: `Cannot delete category with ${category._count.products} products. Remove products first.`
            });
        }

        await prisma.category.delete({
            where: { id }
        });

        res.status(200).json({
            message: 'Category deleted successfully'
        });
    } catch (e) {
        console.error('Delete category error:', e);
        res.status(500).json({ error: 'Failed to delete category' });
    }
};
