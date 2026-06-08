import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { analyticsAPI } from '../../services/api';
import { DashboardStats, HeatmapData, ActionRadarData } from '../../types';

interface AnalyticsState {
  stats: DashboardStats | null;
  heatmap: HeatmapData[];
  actionRadar: ActionRadarData;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  currentWorkspaceId: string; // 'personal' or actual ID
  error: string | null;
}

const initialState: AnalyticsState = {
  stats: null,
  heatmap: [],
  actionRadar: { urgent: [], stale: [] },
  status: 'idle',
  currentWorkspaceId: 'personal',
  error: null,
};

export const fetchAnalytics = createAsyncThunk('analytics/fetch', async (workspaceId: string, { rejectWithValue }) => {
  try {
    const apiParam = workspaceId === 'personal' ? undefined : workspaceId;
    const [statsRes, heatmapRes, radarRes] = await Promise.all([
      analyticsAPI.getDashboardStats(apiParam),
      analyticsAPI.getProductivityHeatmap(apiParam),
      analyticsAPI.getActionRadar(apiParam)
    ]);
    return {
      workspaceId,
      stats: statsRes.data,
      heatmap: heatmapRes.data || [],
      actionRadar: radarRes.data
    };
  } catch (err: any) {
    return rejectWithValue('Failed to load analytics');
  }
});

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
        state.stats = action.payload.stats;
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