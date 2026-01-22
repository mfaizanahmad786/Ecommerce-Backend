import bcrypt from 'bcrypt'
import { Request, Response } from 'express'
import prisma from '../config/database'
import jwt from 'jsonwebtoken'

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (email && password) {
            const user = await prisma.user.findUnique({
                where: {
                    email: email
                }
            })

            if (!user) {
                return res.status(401).json({ error: 'Invalid Credentials' })
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid Credentials' })
            }

            return res.status(200).json({ message: 'Login successful' })
        }

        return res.status(400).json({ error: 'Email and password required' })
    } catch (e) {
        res.status(500).json({ error: 'Invalid Login' })
    }
}

export const register = async (req : Request, res: Response)=>{
    try{
    const {email, password, name} = req.body

    if(!email || !password || !name){
        return res.status(400).json({error: 'Invalid Login'})
    }

    const user = await prisma.user.findUnique({
        where:{
            email: email
        }
    })

    if(user){
        return res.status(401).json({error: 'User already exists'})
    }

    const hashedPassword = await bcrypt.hash(password,10)

    const newUser = await prisma.user.create({
        data:{
            email,
            name,
            password: hashedPassword
        }
    })

    const token = jwt.sign(
        {userId: newUser.id, role: newUser.role},
        process.env.JWT_SECRET!,
        {expiresIn: '7d'}
    )

    return res.status(201).json({
        message: 'User registered succesfully',
        token,
        user:{
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role
        }
    })
}catch(e){
    return res.status(500).json({error: "Regsitration Failed"})
}
}