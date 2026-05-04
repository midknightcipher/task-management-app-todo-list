import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import analyticsRoutes from './routes/analytics';
import workspaceRoutes from './routes/workspaceRoutes'; // ✅ added

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/workspaces', workspaceRoutes); // ✅ added

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});