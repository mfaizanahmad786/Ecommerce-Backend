import { Request,Response } from "express"
import prisma from "../config/database"


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
        res.status(500).json({error: 'Failed to fetch product'})
    }
}