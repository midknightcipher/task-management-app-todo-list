import express from 'express';
import { createWorkspace } from '../controllers/workspaceController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticateToken, createWorkspace);

export default router;