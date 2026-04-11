import React from 'react';
import { Dashboard } from '../components/Analytics/Dashboard';
import '../styles/Pages.css';

export const AnalyticsPage: React.FC = () => (
  <div className="page">
    <div className="page__header">
      <div>
        <h1 className="page__title">Analytics</h1>
        <p className="page__subtitle">Insights into your productivity and task progress</p>
      </div>
    </div>
    <Dashboard />
  </div>
);
