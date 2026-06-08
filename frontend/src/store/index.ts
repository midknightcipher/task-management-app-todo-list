import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import taskReducer from './slices/taskSlice';
import workspaceReducer from './slices/workspaceSlice';
import analyticsReducer from './slices/analyticsSlice'; // 🆕

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    workspaces: workspaceReducer,
    analytics: analyticsReducer, // 🆕
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;