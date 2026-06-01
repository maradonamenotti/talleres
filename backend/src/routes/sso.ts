import { Router } from 'express';
import { handleSSO } from '../controllers/sso';

const router = Router();

router.post('/sso', handleSSO);

export default router;
