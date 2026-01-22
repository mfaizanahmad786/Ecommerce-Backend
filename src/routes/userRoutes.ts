import { Router } from 'express';
import { login, register } from '../controllers/userControllers.js';
import { authenticate } from '../middleware/authMiddlewares.js';


const router = Router()

router.post('/register', register)
router.post('/login', login)

router.get('/profile',authenticate, async (req, res) => {
    res.json({
        message: 'This is a protected rout',
        user: req.user
    })
})
export default router