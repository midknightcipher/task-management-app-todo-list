import React, { useEffect, useState } from 'react';
import { HeatmapData } from '../../types';
import { analyticsAPI } from '../../services/api';
import '../styles/Heatmap.css';

export const ProductivityHeatmap: React.FC = () => {
  const [data, setData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await analyticsAPI.getProductivityHeatmap();
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch heatmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading heatmap...</div>;

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const dataMap = new Map(
  data.map((item) => [
    item.date.split('T')[0],   // ✅ FIX HERE
    item.completed_count
  ])
);

  const getIntensity = (count: number): string => {
    if (count === 0) return 'intensity-0';
    if (count <= 2) return 'intensity-1';
    if (count <= 4) return 'intensity-2';
    if (count <= 6) return 'intensity-3';
    return 'intensity-4';
  };

  return (
    <div className="heatmap-container">
      <h3>30-Day Productivity Heatmap</h3>

      <div className="heatmap-grid">
        {last30Days.map((date) => {
          const count = dataMap.get(date) || 0;
          return (
            <div
              key={date}
              className={`heatmap-cell ${getIntensity(count)}`}
              title={`${date}: ${count} tasks completed`}
            />
          );
        })}
      </div>

      <div className="heatmap-legend">
        <span className="legend-label">Less</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`legend-cell intensity-${i}`} />
        ))}
        <span className="legend-label">More</span>
      </div>
    </div>
  );
};