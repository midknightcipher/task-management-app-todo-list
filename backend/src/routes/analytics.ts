import express from 'express';
import {
  getDashboardStats,
  getProductivityHeatmap,
  getActionRadar
} from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply auth to all analytics routes
router.use(authenticateToken);

// Core ETL-powered dashboard stats
router.get('/dashboard', getDashboardStats);

// The heatmap remains powered by the real-time DB query for now
router.get('/heatmap', getProductivityHeatmap);

// NEW: Endpoint to power the Action Radar list component
router.get('/action-radar', getActionRadar);

export default router;