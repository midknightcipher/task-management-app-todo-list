import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { tasksAPI } from '../../services/api';
import { Task, CreateTaskInput, UpdateTaskInput } from '../../types';

interface TaskState {
  items: Task[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: TaskState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchTasks = createAsyncThunk('tasks/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await tasksAPI.getAll();
    return response.data;
  } catch (err: any) {
    return rejectWithValue('Failed to fetch tasks');
  }
});

export const createTask = createAsyncThunk('tasks/create', async (data: CreateTaskInput, { rejectWithValue }) => {
  try {
    const response = await tasksAPI.create(data);
    return response.data;
  } catch (err: any) {
    return rejectWithValue('Failed to create task');
  }
});

export const updateTask = createAsyncThunk('tasks/update', async ({ id, data }: { id: string; data: UpdateTaskInput }, { rejectWithValue }) => {
  try {
    const response = await tasksAPI.update(id, data);
    return response.data;
  } catch (err: any) {
    return rejectWithValue('Failed to update task');
  }
});

export const toggleTask = createAsyncThunk('tasks/toggle', async (id: string, { rejectWithValue }) => {
  try {
    const response = await tasksAPI.toggle(id);
    return response.data;
  } catch (err: any) {
    return rejectWithValue('Failed to toggle task');
  }
});

export const deleteTask = createAsyncThunk('tasks/delete', async (id: string, { rejectWithValue }) => {
  try {
    await tasksAPI.delete(id);
    return id; 
  } catch (err: any) {
    return rejectWithValue('Failed to delete task');
  }
});

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(createTask.fulfilled, (state, action: PayloadAction<Task>) => {
        state.items.unshift(action.payload); // Add new task to the top
      })
      .addCase(updateTask.fulfilled, (state, action: PayloadAction<Task>) => {
        const index = state.items.findIndex((task) => task.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(toggleTask.fulfilled, (state, action: PayloadAction<Task>) => {
        const index = state.items.findIndex((task) => task.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(deleteTask.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((task) => task.id !== action.payload);
      });
  },
});

export default taskSlice.reducer;