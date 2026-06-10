import express from 'express';
import {
  getKPIs,
  getWorkspaceKPIs,
  getTrends,
  getHeatmap,
  getActionRadar
} from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/kpis', getKPIs);
router.get('/workspace/:workspaceId/kpis', getWorkspaceKPIs);
router.get('/trends', getTrends);
router.get('/heatmap', getHeatmap);
router.get('/action-radar', getActionRadar);

export default router;