import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import analyticsRoutes from './routes/analytics';
import workspaceRoutes from './routes/workspace';
import activityRoutes from './routes/activity';
import commentRoutes from './routes/comments';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.use('/api/auth',      authRoutes);
app.use('/api/tasks',     taskRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/activity',  activityRoutes);
app.use('/api/comments',  commentRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
