import { Request,Response,NextFunction } from "express";
import jwt from 'jsonwebtoken'

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                role: string;
            }
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction)=>{
    try{
        const token = req.headers.authorization?.split(' ')[1]

        if(!token){
            return res.status(401).json({error: 'No token provided'})
        }

        const decoded = jwt.verify(token,process.env.JWT_SECRET!) as {
            userId: string;
            role: string;
        }

        req.user = decoded;

        next()

    }catch(e){
        res.status(401).json({error: 'Invalid or expired token'})
    }
}

export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        next();
    };
};