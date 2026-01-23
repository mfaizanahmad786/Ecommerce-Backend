import { Request,Response } from "express"
import prisma from "../config/database"
import { stopCoverage } from "node:v8"


export const getProducts = async (req: Request, res: Response) => {
    try{
        const {
            category,
            minPrice,
            maxPrice,
            search,
            page = '1',
            limit = '10',
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query

        const where: any = {}

        if(category){
            where.categoryId = category
        }

        if(minPrice || maxPrice){
            where.price = {};
            if(minPrice) where.minPrice.gte = parseFloat(minPrice as string)
            if(maxPrice) where.maxPrice.gte = parseFloat(maxPrice as string)
        }

        if(search){
            where.name = {
                contains: search as string,
                mode: 'insensitive'
            }
        }

        const pageNum = parseInt(page as string)
        const limitNum = parseInt(limit as string)
        const skip = (pageNum - 1) * limitNum

        const products = await prisma.product.findMany({
            where,
            skip,
            take: limitNum,
            orderBy:{
                [sortBy as string]: order as 'asc' | 'desc'
            },
            include:{
                category: true
            }
        })

        const total = await prisma.product.count({where})

       res.status(200).json({
            products,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });

    }catch(e){
         console.error('Get products error:', e);
        res.status(500).json({error: 'Failed to fetch products'})
    }
}

export const getProductById = async (req:Request,res:Response) => {
    try{
        const id = req.params.id as string

        if (!id) {
            return res.status(400).json({ error: 'Product id is required' })
        }

        const product = await prisma.product.findUnique({
            where:{
                id: id
            },
            include:{
                category: true
            }
        })

        if (!product) {
            return res.status(404).json({ error: 'Product not found' })
        }

        return res.status(200).json({ product })

    }catch(e){
         console.error('Get products error:', e);
         res.status(500).json({error: 'Failed to fetch product'})
    }
}

export const createProduct = async (req:Request, res:Response) => {
    try{
        const {name, price, description, stock, categoryId, images} = req.body;

        if (!name || !price) {
            return res.status(400).json({ error: 'Name and price are required' });
        }

        const product = await prisma.product.create({
            data:{
                name,
                price: parseFloat(price),
                description,
                stock: stock ? parseInt(stock) : 0,
                categoryId,
                images: images || []
            }
        })

        res.status(201).json(product)
    }catch(e){
          console.error('Create products error:', e);
         res.status(500).json({error: 'Failed to create product'})
    }
}

export const updateProduct = async (req:Request, res:Response) => {
    try{
        const id = req.params.id as string

        const { name, price, description, stock, categoryId, images } = req.body;

        const product = await prisma.product.update({
            where:{id},
            data: {
                ...(name && { name }),
                ...(price && { price: parseFloat(price) }),
                ...(description && { description }),
                ...(stock !== undefined && { stock: parseInt(stock) }),
                ...(categoryId && { categoryId }),
                ...(images && { images })
            },
            include: {
                category: true
            }
        })

        res.status(200).json(product)
    }catch(e){

        console.error('update products error:', e);
        res.status(500).json({error: 'Failed to update product'})
    }
}

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        await prisma.product.delete({
            where: { id }
        });

        res.status(200).json({ message: 'Product deleted successfully' });

    } catch (e) {
        console.error('Delete product error:', e);
        res.status(500).json({ error: 'Failed to delete product' });
    }
};