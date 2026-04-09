import React from 'react';
import { Dashboard } from '../components/Analytics/Dashboard';
import { CompletionRateChart } from '../components/Analytics/CompletionRateChart';
import { PriorityBreakdown } from '../components/Analytics/PriorityBreakdown';
import { ProductivityHeatmap } from '../components/Analytics/ProductivityHeatmap';
import '../styles/Pages.css';

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="analytics-page">
      <h1>Analytics & Productivity</h1>
      <Dashboard />
      
    </div>
  );
};