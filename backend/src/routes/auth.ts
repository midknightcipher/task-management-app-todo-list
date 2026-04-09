import express from 'express';
import { signup, login } from '../controllers/authController';
import { validateRequest, schemas } from '../middleware/validation';

const router = express.Router();

router.post('/signup', validateRequest(schemas.signup), signup);
router.post('/login', validateRequest(schemas.login), login);

export default router;