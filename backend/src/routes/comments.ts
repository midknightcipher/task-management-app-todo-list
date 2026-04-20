import express from 'express';
import { createComment, getComments, deleteComment } from '../controllers/commentController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// POST /api/comments
router.post('/', createComment);

// GET /api/comments?taskId=xxx
router.get('/', getComments);

// DELETE /api/comments/:id
router.delete('/:id', deleteComment);

export default router;
