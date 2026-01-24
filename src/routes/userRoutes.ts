import { Router } from 'express';
import { login, register } from '../controllers/userControllers.js';
import { authenticate } from '../middleware/authMiddlewares.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../config/validationSchemas.js';

const router = Router();

// Apply validation middleware before controllers
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

router.get('/profile', authenticate, async (req, res) => {
    res.json({
        message: 'This is a protected route',
        user: req.user
    });
});

export default router;