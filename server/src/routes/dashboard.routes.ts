import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getDashboardSummary } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/summary', authenticate, getDashboardSummary);

export default router;
