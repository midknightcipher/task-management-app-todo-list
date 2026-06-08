import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { workspaceAPI } from '../../services/api';
import { Workspace } from '../../types';

interface WorkspaceState {
  workspaces: Workspace[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: WorkspaceState = {
  workspaces: [],
  status: 'idle',
  error: null,
};

export const fetchWorkspaces = createAsyncThunk('workspaces/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await workspaceAPI.getAll();
    return response.data;
  } catch (err: any) {
    return rejectWithValue('Failed to fetch workspaces');
  }
});

export const createWorkspace = createAsyncThunk('workspaces/create', async (name: string, { rejectWithValue }) => {
  try {
    const response = await workspaceAPI.create(name);
    return response.data;
  } catch (err: any) {
    return rejectWithValue('Failed to create workspace');
  }
});

export const deleteWorkspace = createAsyncThunk('workspaces/delete', async (id: string, { rejectWithValue }) => {
  try {
    await workspaceAPI.delete(id);
    return id;
  } catch (err: any) {
    return rejectWithValue('Failed to delete workspace');
  }
});

const workspaceSlice = createSlice({
  name: 'workspaces',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchWorkspaces.fulfilled, (state, action: PayloadAction<Workspace[]>) => {
        state.status = 'succeeded';
        state.workspaces = action.payload;
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(createWorkspace.fulfilled, (state, action: PayloadAction<Workspace>) => {
        state.workspaces.push(action.payload);
      })
      .addCase(deleteWorkspace.fulfilled, (state, action: PayloadAction<string>) => {
        state.workspaces = state.workspaces.filter((ws) => ws.id !== action.payload);
      });
  },
});

export default workspaceSlice.reducer;