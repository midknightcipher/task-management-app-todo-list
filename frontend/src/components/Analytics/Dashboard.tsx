import React, { useEffect, useState } from 'react';
import { DashboardStats } from '../../types';
import { analyticsAPI } from '../../services/api';
import '../styles/Dashboard.css';
import { CompletionRateChart } from './CompletionRateChart';
import { PriorityBreakdown } from './PriorityBreakdown';
import { ProductivityHeatmap } from './ProductivityHeatmap';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getDashboardStats();
      setStats(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading statistics...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!stats) return <div>No data available</div>;

  return (
    <div className="dashboard-container">
      <h2>Dashboard</h2>
      <div style={{ marginTop: '20px' }}>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total Tasks</div>
          <div className="stat-value">{stats.totalTasks}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-title">Completed</div>
          <div className="stat-value">{stats.completedTasks}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-title">Pending</div>
          <div className="stat-value">{stats.pendingTasks}</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-title">Overdue</div>
          <div className="stat-value">{stats.overdueTasks}</div>
        </div>
        <div className="stat-card info">
          <div className="stat-title">Completion Rate</div>
          <div className="stat-value">{stats.completionRate}%</div>
        </div>
      </div>
      </div>
      
      <div className="charts-grid" style={{ marginTop: '20px' }}>
      <CompletionRateChart/>
      <PriorityBreakdown/>
      <ProductivityHeatmap/>
      </div>
    </div>
  );
};