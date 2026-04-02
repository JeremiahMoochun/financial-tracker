import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', authController.registerValidation, authController.register);
router.post('/login', authController.loginValidation, authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);
router.patch('/profile', authMiddleware, authController.updateProfile);
router.post(
  '/onboarding',
  authMiddleware,
  authController.completeOnboardingValidation,
  authController.completeOnboarding
);
router.patch(
  '/baseline',
  authMiddleware,
  authController.updateBaselineValidation,
  authController.updateBaseline
);

export default router;
