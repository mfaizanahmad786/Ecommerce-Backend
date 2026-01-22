import { Request,Response } from "express"
import prisma from "../config/database"

export const getProducts = async (req: Request , res: Response) => {
    try{
        const products = await (prisma as any).product.findMany({
            include:{
                category: true
            }
        });

        res.status(200).json(products)
    }catch(e){
        res.status(500).json({error: 'Failed to fetch products'})
    }
}