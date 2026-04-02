import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getGhostOverview } from '../controllers/ghost.controller.js';

const router = Router();

router.get('/overview', authenticate, getGhostOverview);

export default router;
