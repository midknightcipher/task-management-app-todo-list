import express from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
} from '../controllers/taskController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest, schemas } from '../middleware/validation';

const router = express.Router();

router.use(authenticateToken);

router.post('/', validateRequest(schemas.createTask), createTask);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.put('/:id', validateRequest(schemas.updateTask), updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/toggle', toggleTaskCompletion);

export default router;