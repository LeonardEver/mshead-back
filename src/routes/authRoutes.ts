import express from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController'; // Importe getMe
import { firebaseProtect } from '../middleware/firebaseAuthMiddleware'; // Importe o middleware

const router = express.Router();

// POST /api/auth/register (Mantido, mas menos usado agora com Firebase no front)
router.post('/register', registerUser);

// POST /api/auth/login (Mantido, mas menos usado agora)
router.post('/login', loginUser);

// ADICIONE ESTA ROTA:
// GET /api/auth/me - Rota protegida para pegar dados do usuário logado
router.get('/me', firebaseProtect, getMe);

export default router;