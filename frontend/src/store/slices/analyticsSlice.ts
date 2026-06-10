import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { analyticsAPI, LiveKPIs, TrendData, HeatmapPoint } from '../../services/api';
import { ActionRadarData } from '../../types';

interface AnalyticsState {
  kpis: LiveKPIs | null;
  trends: TrendData[];
  heatmap: HeatmapPoint[];
  actionRadar: ActionRadarData;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  currentWorkspaceId: string; 
  error: string | null;
}

const initialState: AnalyticsState = {
  kpis: null,
  trends: [],
  heatmap: [],
  actionRadar: { urgent: [], stale: [] },
  status: 'idle',
  currentWorkspaceId: 'personal',
  error: null,
};

export const fetchAnalytics = createAsyncThunk(
  'analytics/fetch',
  async (workspaceId: string, { rejectWithValue }) => {
    try {
      const isWorkspace = workspaceId !== 'personal';
      const wsParam = isWorkspace ? workspaceId : undefined;
      const currentYear = new Date().getFullYear();

      const [kpiRes, trendRes, heatRes, radarRes] = await Promise.all([
        isWorkspace ? analyticsAPI.getWorkspaceKPIs(wsParam!) : analyticsAPI.getKPIs(),
        analyticsAPI.getTrends('30d', wsParam),
        analyticsAPI.getHeatmap(currentYear, wsParam),
        analyticsAPI.getActionRadar(wsParam)
      ]);

      return {
        workspaceId,
        kpis: kpiRes.data,
        trends: trendRes.data || [],
        heatmap: heatRes.data || [],
        actionRadar: radarRes.data
      };
    } catch (err: any) {
      return rejectWithValue('Failed to load analytics');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentWorkspaceId = action.payload.workspaceId;
        state.kpis = action.payload.kpis;
        state.trends = action.payload.trends;
        state.heatmap = action.payload.heatmap;
        state.actionRadar = action.payload.actionRadar;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export default analyticsSlice.reducer;