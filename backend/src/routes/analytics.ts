import express from 'express';
import {
  getDashboardStats,
  getTeamIntelligence,
  getPipelineHealth,
  getProductivityHeatmap,
  getActionRadar
} from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply auth to all analytics routes
router.use(authenticateToken);

// Core ETL-powered dashboard stats
router.get('/dashboard', getDashboardStats);

// Replaces the old /priority route for the new team charts
router.get('/intelligence', getTeamIntelligence);

// The heatmap remains powered by the real-time DB query for now
router.get('/heatmap', getProductivityHeatmap);

// Infrastructure route: let the frontend check on the Python worker
router.get('/pipeline-health', getPipelineHealth);

// NEW: Endpoint to power the Action Radar list component
router.get('/action-radar', getActionRadar);

export default router;