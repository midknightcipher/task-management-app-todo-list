import express from 'express';
import {
  getDashboardStats,
  getPriorityAnalytics,
  getProductivityHeatmap,
} from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/dashboard', getDashboardStats);
router.get('/priority', getPriorityAnalytics);
router.get('/heatmap', getProductivityHeatmap);

export default router;